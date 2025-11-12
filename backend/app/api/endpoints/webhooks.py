import hmac
import hashlib
import json
import logging
import asyncio

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.services.github_service import GitHubService
from app.services.workflow_service import WorkflowService
from app.api.endpoints.sse import broadcast_event
from app.db.models.installation import Installation


router = APIRouter()

logger = logging.getLogger(__name__)


async def _verify_webhook_signature(
    request: Request, x_hub_signature_256: str = Header(None)
):
    """
    Verify the GitHub webhook signature.

    This function ensures that the incoming webhook request is legitimate by verifying
    the `X-Hub-Signature-256` header against the computed HMAC SHA-256 hash of the request body.
    It uses the GitHub App's webhook secret to compute the hash.

    Args:
        request (Request): The FastAPI request object containing the webhook payload.
        x_hub_signature_256 (str): The `X-Hub-Signature-256` header provided by GitHub,
            used to verify the authenticity of the request.

    Returns:
        bytes: The raw body of the request if the signature is valid.

    Raises:
        HTTPException: If the `X-Hub-Signature-256` header is missing (401).
        HTTPException: If the signature does not match the expected value (401).
    """
    if not x_hub_signature_256:
        raise HTTPException(
            status_code=401, detail="X-Hub-Signature-256 header is missing"
        )

    try:
        body = await request.body()
    except Exception as e:
        logger.warning(f"Failed to read webhook body: {e}")
        raise HTTPException(status_code=400, detail="Failed to read request body")

    mac = hmac.new(
        settings.GITHUB_APP_WEBHOOK_SECRET.encode(), msg=body, digestmod=hashlib.sha256
    )

    expected_signature = f"sha256={mac.hexdigest()}"

    if not hmac.compare_digest(expected_signature, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    return body


# TODO: Break this bitch up. Doing WAY too many things, just dont want to mess with it since I finally got it working properly
# TODO: We need to add handling when runners are added and removed and all the associated actions.
@router.post("/github")
async def github_webhook(
    body: bytes = Depends(_verify_webhook_signature),
    db: Session = Depends(get_db),
):
    """
    GitHub webhook event handler.

    This endpoint receives and processes GitHub webhook events, including workflow runs,
    workflow jobs, and installation events. It verifies the webhook signature, parses the
    payload, and delegates event-specific logic to service classes. Supported events include:

    - `workflow_run`: Updates workflow run status and broadcasts changes via SSE.
    - `workflow_job`: Updates workflow job status and broadcasts changes via SSE.
    - `installation` (created/deleted): Handles GitHub App installation lifecycle.

    Args:
        body (bytes): Raw request body, verified for authenticity.
        db (Session): SQLAlchemy database session.

    Returns:
        dict: Status and message indicating the result of event processing.

    Raises:
        HTTPException: If the payload is invalid, required fields are missing, or the event type is unsupported.
    """
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        logger.error("Invalid JSON payload")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    workflow_service = WorkflowService(db)

    if "workflow_run" in payload:
        installation = payload.get("installation")
        workflow_run = payload.get("workflow_run")
        repository = payload.get("repository")

        if not installation or not workflow_run or not repository:
            logger.warning(
                f"Missing required fields in workflow_run payload: {payload}"
            )
            raise HTTPException(status_code=400, detail="Missing required fields")

        logger.info(
            f"Processing workflow_run event for installation {installation['id']}, "
            f"repository {repository['full_name']}, run {workflow_run['id']}, "
            f"action: {payload.get('action', 'unknown')}"
        )

        await workflow_service.process_workflow_run_event(
            installation["id"], workflow_run, repository
        )

        try:

            installation_record = (
                db.query(Installation)
                .filter(Installation.installation_id == installation["id"])
                .first()
            )

            if installation_record and installation_record.organization_id:
                event_type = f"workflow_run_{payload.get('action', 'updated')}"
                event_data = {
                    "run_id": str(workflow_run["id"]),
                    "run_attempt": workflow_run.get("run_attempt", 1),
                    "status": workflow_run.get("status"),
                    "conclusion": workflow_run.get("conclusion"),
                    "workflow_name": workflow_run.get("name"),
                    "action": payload.get("action"),
                }

                logger.info(
                    f"Broadcasting SSE event: {event_type} for org {installation_record.organization_id}"
                )
                logger.info(f"Event data: {event_data}")

                asyncio.create_task(
                    broadcast_event(
                        installation_record.organization_id,
                        event_type,
                        event_data,
                    )
                )
                logger.info("SSE event broadcast task created")
            else:
                logger.debug("No installation record found for SSE broadcast")
        except Exception as e:
            logger.debug(f"SSE broadcast failed (non-critical): {e}")

        return {"status": "success", "message": "Processed workflow_run event"}

    if "workflow_job" in payload:
        installation = payload.get("installation")
        workflow_job = payload.get("workflow_job")
        repository = payload.get("repository")

        if not installation or not workflow_job or not repository:
            logger.warning(
                f"Missing required fields in workflow_job payload: {payload}"
            )
            raise HTTPException(status_code=400, detail="Missing required fields")

        logger.info(
            f"Processing workflow_job event for installation {installation['id']}, "
            f"repository {repository['full_name']}, job {workflow_job['id']}, "
            f"action: {payload.get('action', 'unknown')}"
        )

        await workflow_service.process_workflow_job_event(
            installation["id"], workflow_job, repository
        )

        try:
            installation_record = (
                db.query(Installation)
                .filter(Installation.installation_id == installation["id"])
                .first()
            )

            if installation_record and installation_record.organization_id:
                event_type = f"workflow_job_{payload.get('action', 'updated')}"
                event_data = {
                    "job_id": str(workflow_job["id"]),
                    "run_id": str(workflow_job.get("run_id")),
                    "run_attempt": workflow_job.get("run_attempt", 1),
                    "status": workflow_job.get("status"),
                    "conclusion": workflow_job.get("conclusion"),
                    "job_name": workflow_job.get("name"),
                    "action": payload.get("action"),
                }

                logger.info(
                    f"Broadcasting SSE job event: {event_type} for org {installation_record.organization_id}"
                )
                logger.info(f"Job event data: {event_data}")

                asyncio.create_task(
                    broadcast_event(
                        installation_record.organization_id,
                        event_type,
                        event_data,
                    )
                )
                logger.info("SSE job event broadcast task created")
            else:
                logger.debug("No installation record found for job SSE broadcast")
        except Exception as e:
            logger.debug(f"SSE job broadcast failed (non-critical): {e}")

        return {"status": "success", "message": "Processed workflow_job event"}

    if "installation" in payload and payload.get("action") in ["created", "deleted"]:
        logger.info(
            f"Processing installation event: {payload['action']} for installation {payload['installation']['id']}"
        )

        github_service = GitHubService(db=db)
        await github_service.handle_installation_event(payload=payload)

        return {"status": "success", "message": "Processed installation event"}

    event_type = "unknown"
    if "workflow_run" in payload:
        event_type = "workflow_run"
    elif "workflow_job" in payload:
        event_type = "workflow_job"
    elif "installation" in payload:
        event_type = f"installation ({payload.get('action', 'unknown')})"

    logger.warning(
        f"Unhandled event type: {event_type}, action: {payload.get('action', 'N/A')}, "
        f"keys present: {list(payload.keys())}"
    )
    raise HTTPException(status_code=400, detail=f"Unhandled event type: {event_type}")


async def _handle_workflow_run(payload):
    pass


async def _handle_workflow_job(payload):
    pass
