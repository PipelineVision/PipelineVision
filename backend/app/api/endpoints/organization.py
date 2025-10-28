# backend/app/api/endpoints/organization.py
import logging
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.account import OrganizationMembership, Organization
from app.api.dependencies import get_current_user
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)

router = APIRouter()


# TODO: Create reponse object
@router.get("/members")
async def get_organization_members(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all members of the user's current organization.

    Returns:
        dict: Dictionary containing members list and total count

    Raises:
        HTTPException: No organization id (400)
        HTTPException: No organization found with the provided organization_id (404)
        HTTPException: 500
    """
    try:
        if not user.get("organization_id"):
            raise HTTPException(
                status_code=400,
                detail="No organization selected. Please select an organization first.",
            )

        organization_id = user["organization_id"]

        github_service = GitHubService(db)
        if not github_service.can_user_access_organization(user["id"], organization_id):
            raise HTTPException(
                status_code=403, detail="You don't have access to this organization"
            )

        organization = (
            db.query(Organization).filter(Organization.id == organization_id).first()
        )

        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")

        members = github_service.get_organization_members(organization_id)

        logger.info(
            f"Retrieved {len(members)} members for organization {organization.login}"
        )

        return {
            "members": members,
            "total_count": len(members),
            "organization": {
                "id": organization.id,
                "name": organization.name or organization.login,
                "login": organization.login,
                "avatar_url": organization.avatar_url,
                "type": organization.type,
            },
        }

    except HTTPException as e:
        logger.error(f"HTTP error in get organization members: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to get organization members: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# TODO: Create reponse object
@router.post("/members/{user_id}/role")
async def update_member_role(
    user_id: str,
    new_role: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a member's role in the organization (OWNER, ADMIN, MEMBER).
    Only owners and admins can change roles.

    Args:
        user_id
        new_role

    Raise:
        HTTPExcception: No organization selected (404)
        HTTPExcception: Changing owner without proper permission (403)
        HTTPException: Invalid role (400)
        HTTPException: Member not found in organization (404)
    """
    try:
        if not user.get("organization_id"):
            raise HTTPException(status_code=400, detail="No organization selected")

        organization_id = user["organization_id"]

        current_user_membership = (
            db.query(OrganizationMembership)
            .filter(OrganizationMembership.user_id == user["id"])
            .filter(OrganizationMembership.organization_id == organization_id)
            .filter(OrganizationMembership.active)
            .first()
        )

        if not current_user_membership or current_user_membership.role != "OWNER":
            raise HTTPException(
                status_code=403,
                detail="Only organization owners can change member roles",
            )

        if new_role not in ["OWNER", "ADMIN", "MEMBER"]:
            raise HTTPException(
                status_code=400, detail="Invalid role. Must be OWNER, ADMIN, or MEMBER"
            )

        target_membership = (
            db.query(OrganizationMembership)
            .filter(OrganizationMembership.user_id == user_id)
            .filter(OrganizationMembership.organization_id == organization_id)
            .filter(OrganizationMembership.active)
            .first()
        )

        if not target_membership:
            raise HTTPException(
                status_code=404, detail="Member not found in organization"
            )

        target_membership.role = new_role
        db.commit()

        logger.info(
            f"Updated member {user_id} role to {new_role} in organization {organization_id}"
        )

        return {"success": True, "message": f"Role updated to {new_role}"}

    except HTTPException as e:
        logger.error(f"HTTP error in update member role: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to update member role: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/members/{user_id}")
async def remove_organization_member(
    user_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a member from the organization.
    Only owners and admins can remove members.

    Args:
        user_id

    Raises:
        HTTPExceptiopn: No organization selected (400)
        HTTPExceptiopn: Only org owner can remove members(403)
        HTTPExceptiopn: Member not found in org (404)
        HTTPExceptiopn: Cant remove owner (400)
        HTTPExceptiopn: Member not found (404)

    """
    try:
        if not user.get("organization_id"):
            raise HTTPException(status_code=400, detail="No organization selected")

        organization_id = user["organization_id"]

        current_user_membership = (
            db.query(OrganizationMembership)
            .filter(OrganizationMembership.user_id == user["id"])
            .filter(OrganizationMembership.organization_id == organization_id)
            .filter(OrganizationMembership.active)
            .first()
        )

        if not current_user_membership or current_user_membership.role != "OWNER":
            raise HTTPException(
                status_code=403, detail="Only organization owners can remove members"
            )

        target_membership = (
            db.query(OrganizationMembership)
            .filter(OrganizationMembership.user_id == user_id)
            .filter(OrganizationMembership.organization_id == organization_id)
            .filter(OrganizationMembership.active)
            .first()
        )

        if not target_membership:
            raise HTTPException(
                status_code=404, detail="Member not found in organization"
            )

        if target_membership.role == "OWNER":
            owner_count = (
                db.query(OrganizationMembership)
                .filter(OrganizationMembership.organization_id == organization_id)
                .filter(OrganizationMembership.role == "OWNER")
                .filter(OrganizationMembership.active)
                .count()
            )

            if owner_count <= 1:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot remove the last owner from the organization",
                )

        target_membership.active = False
        db.commit()

        logger.info(f"Removed member {user_id} from organization {organization_id}")

        return {"success": True, "message": "Member removed successfully"}

    except HTTPException as e:
        logger.error(f"HTTP error in remove member: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Failed to remove member: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
