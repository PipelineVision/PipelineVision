from fastapi import Request, HTTPException, status

from app.schemas.user import User


def get_current_user(request: Request):
    """
    Returns the authenticated user from request.state.user.
    Raises 401 if no user is found (unauthenticated).
    """
    user: User | None = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    return user
