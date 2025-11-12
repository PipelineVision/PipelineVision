import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.db.session import get_db
from app.db.models.account import AuthUser, AuthAccount
from app.schemas.user import User, UserProfileResponse, UserProfileUpdateRequest
from app.api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


# TODO: Update docstring
async def get_github_profile_data(github_username: str, access_token: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/user",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            if response.status_code == 200:
                github_data = response.json()
                return {
                    "bio": github_data.get("bio"),
                    "location": github_data.get("location"),
                    "company": github_data.get("company"),
                    "website": github_data.get("blog"),
                    "avatar_url": github_data.get("avatar_url"),
                    "github_username": github_data.get("login"),
                }
    except Exception as e:
        logger.warning(f"Failed to fetch GitHub profile data: {e}")

    return {}


# TODO: Update docstring
@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        user = db.query(AuthUser).filter(AuthUser.id == current_user["id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        github_account = (
            db.query(AuthAccount)
            .filter(
                AuthAccount.userId == current_user["id"],
                AuthAccount.providerId == "github",
            )
            .first()
        )

        profile_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar_url": user.image,
            "created_at": user.createdAt.isoformat(),
            "updated_at": user.updatedAt.isoformat(),
        }

        if github_account and github_account.accessToken:
            github_data = await get_github_profile_data(
                github_account.accountId, github_account.accessToken
            )
            profile_data.update(github_data)

        return UserProfileResponse(**profile_data)

    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile")


# TODO: Update docstring
@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user = db.query(AuthUser).filter(AuthUser.id == current_user["id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if profile_data.name is not None:
            user.name = profile_data.name

        db.commit()
        db.refresh(user)

        return await get_user_profile(current_user, db)

    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update user profile")
