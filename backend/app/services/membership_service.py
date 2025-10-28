# backend/app/services/membership_service.py
import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.models.account import AuthUser, AuthAccount
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)


class MembershipService:
    def __init__(self, db: Session):
        """
        Initialize the MembershipService instance.

        Args:
            db: The database session to interact with the database.
        """
        self.db = db
        self.github_service = GitHubService(db)

    async def process_new_user_automatic_memberships(self, user_id: str) -> List[str]:
        """
        Process automatic membership addition for a newly signed up user.

        This method:
        1. Finds the user's GitHub account
        2. Uses the GitHub access token to fetch their organization memberships
        3. Automatically adds them to matching organizations with active installations
        4. Notifies organization owners about the new member

        Args:
            user_id (str): The ID of the newly signed up user.

        Returns:
            List[str]: List of organization IDs where the user was automatically added.
        """
        try:
            github_account = await self._get_user_github_account(user_id)
            if not github_account:
                logger.warning(f"No GitHub account found for user {user_id}")
                return []

            if not github_account.accessToken:
                logger.warning(f"No access token available for user {user_id}")
                return []

            # Process automatic memberships
            added_organizations = (
                await self.github_service.process_automatic_membership_on_signup(
                    user_id=user_id, github_access_token=github_account.accessToken
                )
            )

            if added_organizations:
                await self._set_user_preference_if_none(user_id, added_organizations[0])

            for org_id in added_organizations:
                await self.github_service.notify_organization_owners_of_new_member(
                    organization_id=org_id, new_user_id=user_id
                )

            return added_organizations

        except Exception as e:
            logger.error(
                f"Failed to process automatic memberships for user {user_id}: {e}"
            )
            return []

    async def _get_user_github_account(self, user_id: str) -> Optional[AuthAccount]:
        """
        Get the user's GitHub OAuth account.

        Args:
            user_id (str): The ID of the user.

        Returns:
            Optional[AuthAccount]: The user's GitHub account if found, None otherwise.
        """
        return (
            self.db.query(AuthAccount)
            .filter(AuthAccount.userId == user_id)
            .filter(AuthAccount.providerId == "github")
            .first()
        )

    async def check_user_eligibility_for_automatic_membership(
        self, user_id: str
    ) -> bool:
        """
        Check if a user is eligible for automatic membership processing.

        A user is eligible if:
        1. They have a GitHub account with access token
        2. They have no existing organization memberships
        3. They haven't been processed before (or we want to re-process them)

        Args:
            user_id (str): The ID of the user.

        Returns:
            bool: True if the user is eligible, False otherwise.
        """
        try:
            github_account = await self._get_user_github_account(user_id)
            if not github_account or not github_account.accessToken:
                logger.info(
                    f"User {user_id} not eligible: no GitHub account or access token"
                )
                return False

            user = self.db.query(AuthUser).filter(AuthUser.id == user_id).first()
            if not user:
                logger.warning(f"User {user_id} not found in database")
                return False

            has_memberships = len(user.organization_memberships) > 0
            is_eligible = not has_memberships

            logger.info(
                f"User {user_id} eligibility: has_memberships={has_memberships}, eligible={is_eligible}"
            )
            return is_eligible

        except Exception as e:
            logger.error(f"Failed to check eligibility for user {user_id}: {e}")
            return False

    async def _set_user_preference_if_none(self, user_id: str, organization_id: str):
        """
        Set the user's organization preference if they don't have one yet.

        Args:
            user_id (str): The ID of the user.
            organization_id (str): The ID of the organization to set as preference.
        """
        try:
            from app.db.models.user_preferences import UserPreference

            existing_preference = (
                self.db.query(UserPreference)
                .filter(UserPreference.user_id == user_id)
                .first()
            )

            if not existing_preference:
                preference = UserPreference(
                    user_id=user_id,
                    organization_id=organization_id,
                )
                self.db.add(preference)
                self.db.commit()

                logger.info(
                    f"Set default organization preference for user {user_id} to {organization_id}"
                )
            else:
                logger.info(
                    f"User {user_id} already has organization preference: {existing_preference.organization_id}"
                )

        except Exception as e:
            logger.error(f"Failed to set user preference for user {user_id}: {e}")
            self.db.rollback()
