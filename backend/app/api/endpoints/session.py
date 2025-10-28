import logging

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.account import AuthSession

router = APIRouter()

logger = logging.getLogger(__name__)


@router.put("/session/current-org")
def set_current_org(
    org_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Set the current organization for the authenticated user's session.

    This endpoint updates the current organization ID for the user's active session.
    The session is identified using the session token stored in `request.state.user.token`.

    Args:
        org_id (int): The ID of the organization to set as the current organization.
        request (Request): The HTTP request object, used to retrieve the session token.
        user (dict): The authenticated user (injected via dependency).
        db (Session): The database session (injected via dependency).

    Returns:
        dict: A dictionary containing the status of the operation and the updated organization ID:
            - status (str): The status of the operation ("ok").
            - current_org_id (int): The ID of the organization that was set.

    Raises:
        HTTPException: If the session token is missing (401).
        HTTPException: If the session associated with the token is not found (404).
    """
    session_token = getattr(request.state.user, "token", None)
    if not session_token:
        logger.warning(f"No session found with user {request.state.user}")
        raise HTTPException(status_code=401, detail="No session found")

    session = db.query(AuthSession).filter(AuthSession.token == session_token).first()

    if not session:
        logger.warning(f"No session found for session token {session_token}")
        raise HTTPException(status_code=404, detail="Session not found")

    session.current_org_id = org_id
    db.commit()
    return {"status": "ok", "current_org_id": org_id}
