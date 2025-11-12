# backend/app/services/github_service.py
import datetime
import jwt
import time
import httpx
import yaml
import base64

from fastapi import HTTPException
from typing import Dict, Any, List
import logging

from app.core.config import settings
from app.db.models.installation import Installation
from app.db.models.repository import Repository
from app.db.models.account import (
    AuthAccount,
    AuthUser,
    OrganizationMembership,
    Organization,
)
from app.db.models.user_preferences import UserPreference


logger = logging.getLogger(__name__)


class GitHubService:
    def __init__(self, db):
        """
        Initialize the GitHubService instance.

        Args:
            db: The database session to interact with the database.
        """
        self.app_id = settings.GITHUB_APP_ID
        self.db = db
        self.private_key = settings.GITHUB_APP_PRIVATE_KEY
        self.api_url = settings.GITHUB_URL
        self._jwt_token = None
        self._jwt_expiry = 0

    def _validate_jwt_time(self, payload: dict):
        """
        Validate the JWT token's lifetime.

        GitHub has a max JWT lifetime of 10 minutes.

        Args:
            payload (dict): The JWT payload containing "iat" (issued at) and "exp" (expiration) timestamps.

        Raises:
            ValueError: If the token's lifetime exceeds the maximum limit or if the expiration time is in the past.
        """
        max_lifetime = 10 * 60  # GitHub limit: 10 minutes
        lifetime = payload["exp"] - payload["iat"]
        if lifetime > max_lifetime:
            raise ValueError(
                f"JWT lifetime too long: {lifetime}s (max {max_lifetime}s)"
            )
        if lifetime <= 0:
            raise ValueError(
                f"JWT expiration must be in the future: lifetime {lifetime}s"
            )

    @property
    async def jwt_token(self) -> str:
        """
        Generate and retrieve a JWT token for GitHub App authentication.

        This method generates a new JWT token if one does not exist or if the current token
        is about to expire (within 60 seconds). The token is used for authenticating requests
        to GitHub's API as a GitHub App.

        Returns:
            str: The JWT token as a string.

        Raises:
            ValueError: If the token's lifetime validation fails.
        """
        current_time = int(time.time())

        if not self._jwt_token or current_time >= (self._jwt_expiry - 60):
            payload = {
                "iat": current_time - 60,  # Allow 60s skew
                "exp": current_time + (9 * 60),  # Safe within GitHub's limit
                "iss": self.app_id,
            }

            self._validate_jwt_time(payload)  # ✅ Check before encoding

            self._jwt_token = jwt.encode(payload, self.private_key, algorithm="RS256")
            self._jwt_expiry = payload["exp"]
            logger.info("Generated new GitHub App JWT token")

        return self._jwt_token

    async def get_installation_token(self, installation_id: int) -> str:
        """
        Retrieve an installation access token for a specific GitHub App installation.

        Args:
            installation_id (int): The ID of the GitHub App installation.

        Returns:
            str: The installation access token.

        Raises:
            HTTPException: If the token retrieval fails.
        """
        token = await self.jwt_token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/app/installations/{installation_id}/access_tokens",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )

            if response.status_code != 201:
                logger.error(f"Failed to get installation token: {response.text}")
                response.raise_for_status()

            data = response.json()
            return data["token"]

    async def get_app_installations(self) -> List[Dict[str, Any]]:
        """
        Retrieve all installations of the GitHub App.

        Returns:
            List[Dict[str, Any]]: A list of installations with their details.

        Raises:
            HTTPException: If the request to GitHub fails.
        """
        token = await self.jwt_token

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_url}/app/installations",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )

            if response.status_code != 200:
                logger.error(f"Failed to get app installations: {response.text}")
                response.raise_for_status()

            return response.json()

    # TODO: Fix the issue if the orgnaization already exists its creating another row instead of updating the active column
    async def handle_installation_event(self, payload: dict):
        """Handle GitHub App installation events."""
        action = payload.get("action")

        if action == "created":
            installation_data = payload["installation"]
            github_account = installation_data["account"]
            sender = payload["sender"]

            organization = await self._create_or_update_organization(github_account)

            installer_user = await self._get_installer_user(sender)
            if not installer_user:
                raise HTTPException(
                    status_code=400,
                    detail=f"Please sign up for an account first, then install the GitHub App on {github_account['login']}",
                )

            await self._ensure_organization_membership(
                installer_user.id,
                organization.id,
                role="OWNER" if github_account["type"] == "Organization" else "OWNER",
            )

            installation = Installation(
                installation_id=installation_data["id"],
                organization_id=organization.id,
                installer_github_id=sender["id"],
                app_id=installation_data["app_id"],
                installed_at=installation_data["created_at"],
            )

            self.db.add(installation)
            self.db.commit()
            self.db.refresh(installation)

            logger.info(
                f"Created installation for {github_account['login']} by {sender['login']}"
            )

            await self.assign_user_organization(
                user_id=installer_user.id, organization_id=organization.id
            )

            return organization

        # TODO: Decide if we should delete allt the child data (Runners, Jobs, Workflows, Workflow runs)
        # TODO: Figure out the best way to handle if the user has multiple installs so we can switch the user preference to another organization
        elif action == "deleted":
            installation_id = payload["installation"]["id"]

            installation = (
                self.db.query(Installation)
                .filter(Installation.installation_id == installation_id)
                .first()
            )

            if not installation:
                logger.warning(f"No installation found for id {installation_id}")
                return

            organization_id = installation.organization_id

            self.db.query(Repository).filter(
                Repository.installation_id == installation_id
            ).delete(synchronize_session=False)

            self.db.query(Installation).filter(
                Installation.installation_id == installation_id
            ).delete(synchronize_session=False)

            self.db.commit()
            logger.info(
                f"Deleted installation {installation_id} and all related child records"
            )

            remaining_installations = (
                self.db.query(Installation)
                .filter(Installation.organization_id == organization_id)
                .count()
            )

            if remaining_installations == 0:
                self.db.query(Organization).filter(
                    Organization.id == organization_id
                ).delete(synchronize_session=False)
                self.db.commit()
                logger.info(
                    f"Deleted organization {organization_id} as it had no remaining installations"
                )

            self.db.query(UserPreference).filter(
                UserPreference.organization_id == organization_id
            ).delete(synchronize_session=False)
            self.db.commit()

    async def _create_or_update_organization(
        self, github_account: dict
    ) -> Organization:
        """
        Create or update an Organization record based on GitHub account data.

        Args:
            github_account (dict): The GitHub account data.

        Returns:
            Organization: The created or updated Organization record.
        """

        # Check if organization already exists
        organization = (
            self.db.query(Organization)
            .filter(Organization.github_id == github_account["id"])
            .first()
        )

        if organization:
            organization.login = github_account["login"]
            organization.name = github_account.get("name")
            organization.avatar_url = github_account.get("avatar_url")
            organization.type = github_account["type"]
            organization.updated_at = datetime.datetime.utcnow()
        else:
            organization = Organization(
                id=f"org_{github_account['type'].lower()}_{github_account['id']}_{int(time.time())}",
                github_id=github_account["id"],
                login=github_account["login"],
                name=github_account.get("name"),
                avatar_url=github_account.get("avatar_url"),
                type=github_account["type"],
            )
            self.db.add(organization)

        self.db.flush()
        return organization

    async def _get_installer_user(self, installer: dict) -> AuthUser:
        """Get the AuthUser for the installation installer"""

        installer_account = (
            self.db.query(AuthAccount)
            .filter(AuthAccount.accountId == str(installer["id"]))
            .filter(AuthAccount.providerId == "github")
            .first()
        )

        if not installer_account:
            logger.error(f"No installation account: {installer}")
            raise Exception("No installer account")

        return installer_account.user

    async def assign_user_organization(self, user_id: str, organization_id: str):
        """
        Assign a user to an organization by creating a user preference.

        Args:
            user_id (str): The ID of the user.
            organization_id (str): The ID of the organization.
        """
        preference = UserPreference(
            user_id=user_id,
            organization_id=organization_id,
        )
        self.db.add(preference)
        self.db.commit()

    async def _ensure_organization_membership(
        self, user_id: str, organization_id: str, role: str = "MEMBER"
    ):
        """Ensure a user has membership in an organization"""

        existing_membership = (
            self.db.query(OrganizationMembership)
            .filter(OrganizationMembership.user_id == user_id)
            .filter(OrganizationMembership.organization_id == organization_id)
            .first()
        )

        if existing_membership:
            existing_membership.active = True
            existing_membership.role = role
            existing_membership.updated_at = datetime.datetime.utcnow()
        else:
            membership = OrganizationMembership(
                id=f"membership_{user_id}_{organization_id}_{int(time.time())}",
                user_id=user_id,
                organization_id=organization_id,
                role=role,
                active=True,
                joined_at=datetime.datetime.utcnow(),
            )
            self.db.add(membership)

    # def can_user_access_installation(self, user_id: str, installation_id: int) -> bool:
    #     """Check if user can access an installation"""
    #     installation = (
    #         self.db.query(Installation)
    #         .filter(Installation.installation_id == installation_id)
    #         .first()
    #     )

    #     if not installation:
    #         return False

    #     membership = (
    #         self.db.query(OrganizationMembership)
    #         .filter(OrganizationMembership.user_id == user_id)
    #         .filter(
    #             OrganizationMembership.organization_id == installation.organization_id
    #         )
    #         .filter(OrganizationMembership.active)
    #         .first()
    #     )

    #     return membership is not None

    def can_user_access_organization(self, user_id: str, organization_id: str) -> bool:
        """Check if user can access an organization"""
        membership = (
            self.db.query(OrganizationMembership)
            .filter(OrganizationMembership.user_id == user_id)
            .filter(OrganizationMembership.organization_id == organization_id)
            .filter(OrganizationMembership.active)
            .first()
        )

        return membership is not None

    # async def add_user_to_organization(
    #     self,
    #     organization_id: str,
    #     user_id: str,
    #     role: str = "MEMBER",
    # ):
    #     await self._ensure_organization_membership(user_id, organization_id, role)
    #     self.db.commit()

    # def get_user_organizations(self, user_id: str) -> List[Organization]:
    #     """Get all organizations a user belongs to"""
    #     return (
    #         self.db.query(Organization)
    #         .join(OrganizationMembership)
    #         .filter(OrganizationMembership.user_id == user_id)
    #         .filter(OrganizationMembership.active)
    #         .all()
    #     )

    def get_organization_members(self, organization_id: str) -> List[dict]:
        """Get all members of an organization"""
        memberships = (
            self.db.query(OrganizationMembership)
            .join(AuthUser)
            .filter(OrganizationMembership.organization_id == organization_id)
            .filter(OrganizationMembership.active)
            .all()
        )

        return [
            {
                "user_id": membership.user_id,
                "user": membership.user,
                "role": membership.role,
                "joined_at": membership.joined_at,
            }
            for membership in memberships
        ]

    # def get_organization_installations(
    #     self, organization_id: str
    # ) -> List[Installation]:
    #     """Get all installations for an organization"""
    #     return (
    #         self.db.query(Installation)
    #         .filter(Installation.organization_id == organization_id)
    #         .filter(Installation.active)
    #         .all()
    #     )

    # TODO: Make sure this working for both org and self installs.
    # TODO: Currently working on just getting orgs setup correctly
    async def get_organization_runners(
        self, organization_name: str, installation_id: int
    ):
        """Get runners for a specific organization"""
        token = await self.get_installation_token(installation_id)

        async with httpx.AsyncClient() as client:
            installation = (
                self.db.query(Installation)
                .filter(Installation.installation_id == installation_id)
                .first()
            )

            if not installation:
                raise HTTPException(status_code=404, detail="Installation not found")

            url = f"{self.api_url}/orgs/{organization_name}/actions/runners"

            response = await client.get(
                url,
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )

            if response.status_code != 200:
                logger.error(f"Failed to get runners: {response.text}")
                response.raise_for_status()

            return response.json()["runners"]

    # async def sync_organization_from_github(
    #     self, github_org_login: str
    # ) -> Organization:
    #     """
    #     Fetch organization data from GitHub and synchronize it with the database.

    #     Args:
    #         github_org_login (str): The login name of the GitHub organization.

    #     Returns:
    #         Organization: The synchronized Organization record.

    #     Raises:
    #         HTTPException: If the request to GitHub fails.
    #     """
    #     token = await self.jwt_token

    #     async with httpx.AsyncClient() as client:
    #         # Try organization endpoint first
    #         response = await client.get(
    #             f"{self.api_url}/orgs/{github_org_login}",
    #             headers={
    #                 "Authorization": f"Bearer {token}",
    #                 "Accept": "application/vnd.github.v3+json",
    #             },
    #         )

    #         if response.status_code == 404:
    #             # Try user endpoint
    #             response = await client.get(
    #                 f"{self.api_url}/users/{github_org_login}",
    #                 headers={
    #                     "Authorization": f"Bearer {token}",
    #                     "Accept": "application/vnd.github.v3+json",
    #                 },
    #             )

    #         if response.status_code != 200:
    #             logger.error(f"Failed to fetch GitHub data: {response.text}")
    #             response.raise_for_status()

    #         github_data = response.json()
    #         return await self._create_or_update_organization(github_data)

    # async def invite_user_to_organization_via_github(
    #     self, organization_id: str, github_username: str, role: str = "MEMBER"
    # ):
    #     """
    #     Placeholder for inviting users to an organization via GitHub.

    #     Args:
    #         organization_id (str): The ID of the organization.
    #         github_username (str): The GitHub username of the user to invite.
    #         role (str, optional): The role to assign to the user. Defaults to "MEMBER".

    #     Returns:
    #         dict: A message indicating the invite status and organization details.

    #     Raises:
    #         HTTPException: If the organization is not found.
    #     """
    #     organization = (
    #         self.db.query(Organization)
    #         .filter(Organization.id == organization_id)
    #         .first()
    #     )

    #     if not organization:
    #         raise HTTPException(status_code=404, detail="Organization not found")

    #     # For now, just log the invite attempt
    #     logger.info(
    #         f"Invite request: {github_username} to {organization.login} as {role}"
    #     )

    #     # You could implement email invites, slack notifications, etc.
    #     return {
    #         "message": f"Invite sent to {github_username}",
    #         "organization": organization.login,
    #         "role": role,
    #     }

    async def fetch_job_logs(
        self, repository_full_name: str, job_id: str, installation_id: int
    ) -> str:
        """
        Fetch raw logs for a specific GitHub Actions job.

        Args:
            repository_full_name (str): The full name of the repository (owner/repo).
            job_id (str): The GitHub job ID.
            installation_id (int): The GitHub App installation ID.

        Returns:
            str: The raw log content from GitHub.

        Raises:
            HTTPException: If the request to GitHub fails or logs are not available.
        """
        token = await self.get_installation_token(installation_id)
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                f"{self.api_url}/repos/{repository_full_name}/actions/jobs/{job_id}/logs",
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )

            if response.status_code == 404:
                logger.warning(f"Logs not found for job {job_id}")
                return ""
            elif response.status_code != 200:
                logger.error(
                    f"Failed to fetch logs for job {job_id}: {response.status_code}"
                )
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch job logs: {response.text}",
                )

            return response.text

    # TODO: Fix issue with retrieving the content of the workflow (yaml)
    async def fetch_workflow_content(
        self, installation_id: int, repository_full_name: str, workflow_path: str
    ) -> Dict[str, Any]:
        """
        Fetch workflow content from GitHub API.

        Args:
            installation_id (int): The GitHub App installation ID.
            repository_full_name (str): The full name of the repository (owner/repo).
            workflow_path (str): The path to the workflow file.

        Returns:
            Dict[str, Any]: Dictionary containing workflow content, description, and badge URL.

        Raises:
            HTTPException: If the request to GitHub fails.
        """
        token = await self.get_installation_token(installation_id)

        async with httpx.AsyncClient() as client:
            # Get the workflow file content
            response = await client.get(
                f"{self.api_url}/repos/{repository_full_name}/contents/{workflow_path}",
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )

            if response.status_code != 200:
                logger.error(f"Failed to fetch workflow content: {response.text}")
                response.raise_for_status()

            content_data = response.json()

            workflow_content = base64.b64decode(content_data["content"]).decode("utf-8")

            description = self._extract_workflow_description(workflow_content)

            # Generate badge URL
            badge_url = f"https://github.com/{repository_full_name}/actions/workflows/{workflow_path.split('/')[-1]}/badge.svg"

            return {
                "content": workflow_content,
                "description": description,
                "badge_url": badge_url,
            }

    def _extract_workflow_description(self, workflow_content: str) -> str:
        """
        Extract description from workflow YAML content.

        Args:
            workflow_content (str): The YAML content of the workflow.

        Returns:
            str: The extracted description or a default description.
        """
        try:
            workflow_yaml = yaml.safe_load(workflow_content)

            if isinstance(workflow_yaml, dict):
                if "name" in workflow_yaml:
                    return workflow_yaml["name"]

                if "description" in workflow_yaml:
                    return workflow_yaml["description"]

                if "on" in workflow_yaml:
                    triggers = (
                        list(workflow_yaml["on"].keys())
                        if isinstance(workflow_yaml["on"], dict)
                        else [workflow_yaml["on"]]
                    )
                    return f"Workflow triggered by: {', '.join(triggers)}"

            return "GitHub Actions workflow"

        except Exception as e:
            logger.warning(f"Failed to parse workflow YAML: {e}")
            return "GitHub Actions workflow"

    async def get_user_organizations_from_github(
        self, access_token: str
    ) -> List[Dict[str, Any]]:
        """
        Fetch user's organization memberships from GitHub API using user access token.

        Args:
            access_token (str): The user's GitHub access token.

        Returns:
            List[Dict[str, Any]]: List of organizations the user is a member of.

        Raises:
            HTTPException: If the request to GitHub fails.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_url}/user/orgs",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )

            if response.status_code != 200:
                logger.error(f"Failed to get user organizations: {response.text}")
                response.raise_for_status()

            return response.json()

    async def process_automatic_membership_on_signup(
        self, user_id: str, github_access_token: str
    ):
        """
        Process automatic membership addition for a new user based on their GitHub org memberships.

        Args:
            user_id (str): The ID of the newly signed up user.
            github_access_token (str): The user's GitHub access token.

        Returns:
            List[str]: List of organization IDs where the user was automatically added.
        """
        try:
            github_orgs = await self.get_user_organizations_from_github(
                github_access_token
            )

            added_to_orgs = []

            for github_org in github_orgs:
                organization = (
                    self.db.query(Organization)
                    .filter(Organization.github_id == github_org["id"])
                    .first()
                )

                if organization:
                    has_active_installation = (
                        self.db.query(Installation)
                        .filter(Installation.organization_id == organization.id)
                        .filter(Installation.active)
                        .first()
                    )

                    if has_active_installation:
                        await self._ensure_organization_membership(
                            user_id=user_id,
                            organization_id=organization.id,
                            role="MEMBER",
                        )

                        added_to_orgs.append(organization.id)

                        logger.info(
                            f"Automatically added user {user_id} to organization {organization.login}"
                        )

            self.db.commit()
            return added_to_orgs

        except Exception as e:
            logger.error(
                f"Failed to process automatic membership for user {user_id}: {e}"
            )
            self.db.rollback()
            return []

    async def notify_organization_owners_of_new_member(
        self, organization_id: str, new_user_id: str
    ):
        """
        Notify organization owners about a new automatically added member.

        Args:
            organization_id (str): The ID of the organization.
            new_user_id (str): The ID of the newly added user.
        """
        try:
            organization = (
                self.db.query(Organization)
                .filter(Organization.id == organization_id)
                .first()
            )

            if not organization:
                return

            new_user = (
                self.db.query(AuthUser).filter(AuthUser.id == new_user_id).first()
            )

            if not new_user:
                return

            owner_memberships = (
                self.db.query(OrganizationMembership)
                .join(AuthUser)
                .filter(OrganizationMembership.organization_id == organization_id)
                .filter(OrganizationMembership.role == "OWNER")
                .filter(OrganizationMembership.active)
                .all()
            )

            for membership in owner_memberships:
                logger.info(
                    f"NOTIFICATION: User {new_user.name} ({new_user.email}) was automatically "
                    f"added to organization {organization.login} - notify owner {membership.user.name}"
                )

        except Exception as e:
            logger.error(f"Failed to notify owners about new member: {e}")
