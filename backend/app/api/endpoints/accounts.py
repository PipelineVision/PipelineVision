import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.core.config import settings

GITHUB_URL = settings.GITHUB_URL
from app.db.session import get_db
from app.services.github_service import GitHubService
from app.services.membership_service import MembershipService
from app.db.models.account import OrganizationMembership, Organization
from app.db.models.user_preferences import UserPreference
from app.schemas.org import (
    MembershipRequest,
    OrganizationMembershipSchema,
    OrganizationMembersResponse,
)
from app.schemas.user import User
from app.api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/organization-members/{installation_id}",
    response_model=OrganizationMembersResponse,
)
async def get_organization_members(
    installation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, OrganizationMembershipSchema]:
    """
    Retrieve the members of a GitHub organization for a given installation.

    Args:
        installation_id (int): The GitHub App installation ID.
        user (User): The authenticated user (injected via dependency).
        db (Session): The database session (injected via dependency).

    Returns:
        OrganizationMembersResponse: A list of organization members.

    Raises:
        HTTPException: If the organization is not found, the GitHub token is unavailable,
            or there is an error communicating with the GitHub API.
    """

    github_service = GitHubService(db=db)

    organization: Organization = (
        db.query(Organization)
        .filter(Organization.id == user["organization_id"])
        .first()
    )

    if not organization:
        return HTTPException("No organization for the organization_id")

    try:
        token = await github_service.get_installation_token(
            installation_id=installation_id
        )
        if not token:
            raise HTTPException(status_code=401, detail="No GitHub token available")
    except Exception as e:
        logger.error(f"Failed to retrieve GitHub token: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "PipelineVision/1.0",
        "Authorization": f"token {token}",
    }

    members: OrganizationMembersResponse = []
    async with httpx.AsyncClient() as client:
        try:
            page = 1
            while True:
                response = await client.get(
                    f"{GITHUB_URL}/orgs/{organization.login}/members",
                    headers=headers,
                    params={"per_page": 100, "page": page},
                )
                response.raise_for_status()
                page_members = response.json()
                if not page_members:
                    break
                members.extend(page_members)
                page += 1

            return {"members": members}

        except httpx.HTTPStatusError as e:
            logger.error(
                f"GitHub API error: {e.response.status_code} - {e.response.text}"
            )
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"GitHub API error: {e.response.text}",
            )
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")


# TODO: Create reponse object
@router.get("/memberships", response_model=list[OrganizationMembershipSchema])
def get_memberships(
    user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Retrieve the list of organizations the user is a member of.

    Args:
        user (dict): The authenticated user (injected via dependency).
        db (Session): The database session (injected via dependency).

    Raises:
        HTTPException: If the user object is invalid or there is an error retrieving memberships.
    """
    try:
        if "id" not in user:
            raise HTTPException(status_code=400, detail="Invalid user object")

        orgs = (
            db.query(Organization)
            .join(
                OrganizationMembership,
                OrganizationMembership.organization_id == Organization.id,
            )
            .filter(OrganizationMembership.user_id == user["id"])
            .all()
        )

        logger.info(f"Retrieved {len(orgs)} memberships for user {user['id']}")

        return orgs

    except Exception as e:
        logger.error(f"Failed to retrieve memberships: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# TODO: Create reponse object
@router.put("/memberships")
def set_membership(
    body: MembershipRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set or update the user's preferred organization membership.

    Args:
        body (MembershipRequest): The membership request containing the organization ID.
        user (User): The authenticated user (injected via dependency).
        db (Session): The database session (injected via dependency).

    Returns:
        dict: A success message and the updated preference.

    Raises:
        HTTPException: If the organization is not found or there is an error updating the preference.
    """
    try:
        membership_id = body.membership_id

        organization: Organization = (
            db.query(Organization).filter(Organization.id == membership_id).first()
        )
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")

        preference = (
            db.query(UserPreference)
            .filter(UserPreference.user_id == user["id"])
            .first()
        )

        if preference:
            logger.info(
                f"Updating preference for user {user['id']} to organization {membership_id}"
            )
            preference.organization_id = membership_id
        else:
            logger.info(
                f"Creating preference for user {user['id']} with organization {membership_id}"
            )
            preference = UserPreference(
                user_id=user["id"],
                organization_id=membership_id,
            )
            db.add(preference)

        db.commit()
        db.refresh(preference)

        return {
            "success": True,
            "orgId": preference.organization_id,
            "preference": {
                "id": preference.id,
                "user_id": preference.user_id,
                "organization_id": preference.organization_id,
            },
        }

    except HTTPException as e:
        logger.error(f"HTTP error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to set membership: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# TODO: Create reponse object
@router.get("/preferences")
def get_preferences(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Retrieve the user's current organization preference.

    Args:
        user (User): The authenticated user (injected via dependency).
        db (Session): The database session (injected via dependency).

    Returns:
        dict: A success message and the user's current preference, or None if no preference is set.

    Raises:
        HTTPException: If there is an error retrieving the preference.
    """
    try:
        preference = (
            db.query(UserPreference)
            .filter(UserPreference.user_id == user["id"])
            .first()
        )

        if not preference:
            logger.info(f"No preferences found for user {user['id']}")
            return {"success": True, "preference": None}

        logger.info(
            f"Retrieved preference for user {user['id']}: {preference.organization_id}"
        )
        return {
            "success": True,
            "preference": {
                "id": preference.id,
                "user_id": preference.user_id,
                "organization_id": preference.organization_id,
            },
        }

    except Exception as e:
        logger.error(f"Failed to retrieve preferences: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# TODO: Create reponse object
@router.post("/process-automatic-memberships")
async def process_automatic_memberships(
    user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Process automatic membership addition for a user based on their GitHub organization memberships.

    This endpoint is called after a user successfully signs up via GitHub OAuth to automatically
    add them to any organizations in our system that they're already a member of on GitHub.

    Args:
        user (dict): The authenticated user (injected via dependency).
        db (Session): The database session (injected via dependency).

    Returns:
        dict: A success message with the list of organizations the user was added to.

    Raises:
        HTTPException: If the user ID is invalid or there's an error processing memberships.
    """
    try:
        if "id" not in user:
            raise HTTPException(status_code=400, detail="Invalid user object")

        user_id = user["id"]
        membership_service = MembershipService(db)

        is_eligible = (
            await membership_service.check_user_eligibility_for_automatic_membership(
                user_id
            )
        )

        if not is_eligible:
            logger.info(
                f"User {user_id} is not eligible for automatic membership processing"
            )
            return {
                "success": True,
                "message": "User not eligible for automatic membership processing",
                "organizations_added": [],
            }

        added_organizations = (
            await membership_service.process_new_user_automatic_memberships(user_id)
        )

        logger.info(
            f"Processed automatic memberships for user {user_id}, "
            f"added to {len(added_organizations)} organizations"
        )

        return {
            "success": True,
            "message": "Successfully processed automatic memberships",
            "organizations_added": added_organizations,
        }

    except HTTPException as e:
        logger.error(f"HTTP error in automatic memberships: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to process automatic memberships: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
