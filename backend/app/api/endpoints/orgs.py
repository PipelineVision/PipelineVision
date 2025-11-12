import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text


from app.db.session import get_db
from app.db.models.installation import Installation
from app.db.models.runner import Runner
from app.schemas.user import User
from app.schemas.org import Runners
from app.api.dependencies import get_current_user

router = APIRouter()

logger = logging.getLogger(__name__)


# TODO: Rework this. Need to figure out how to collect better stats about the runner
# TODO: Create response object
@router.get("/runners")
async def get_organization_runners(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve information about self-hosted runners for the authenticated user's organization.

    This endpoint provides details about the self-hosted runners associated with the user's
    organization, including the total number of runners, their statuses (online, offline, busy),
    and a list of all runners.

    Args:
        user (User): The authenticated user (injected via dependency).
        db (Session): The database session (injected via dependency).

    Returns:
        dict: A dictionary containing the following keys:
            - total_runners (int): The total number of self-hosted runners in the organization.
            - runners (list[Runners]): A list of self-hosted runners with detailed information.
            - online (int): The number of self-hosted runners currently online.
            - offline (int): The number of self-hosted runners currently offline.
            - busy (int): The number of self-hosted runners currently busy.

    Raises:
        HTTPException: If no installation is found for the user's organization (404).
    """
    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(f"No installation found for {user}")
        raise HTTPException(status_code=404, detail="No installation found")

    # TODO: Not a good long term solution if this label does not exist.
    base_query = db.query(Runner).filter(
        Runner.installation_id == installation.installation_id,
        text(
            "EXISTS (SELECT 1 FROM json_array_elements(labels) AS elem WHERE elem->>'name' = 'self-hosted')"
        ),
    )

    total_runners = base_query.count()

    online_count = base_query.filter(Runner.status == "online").count()

    offline_count = base_query.filter(Runner.status == "offline").count()

    busy_count = base_query.filter(Runner.busy).count()

    runners = base_query.all()

    runners_list = [Runners.from_orm(r) for r in runners]

    return {
        "total_runners": total_runners,
        "runners": runners_list,
        "online": online_count,
        "offline": offline_count,
        "busy": busy_count,
    }
