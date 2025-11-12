import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, case

from app.api.dependencies import get_current_user
from app.db.models.installation import Installation
from app.db.models.job import Workflow, WorkflowRun
from app.db.models.repository import Repository
from app.schemas.user import User
from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


# TODO: Update docstring
# TODO: Create response object
@router.get("/")
async def get_workflows(
    repository_name: Optional[str] = Query(
        None, description="Filter by repository name"
    ),
    state: Optional[str] = Query(
        None, description="Filter by workflow state (active, disabled)"
    ),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        50, ge=1, le=1000, description="Number of records to return (max 1000)"
    ),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(
            f"No installation found for user {user['id']} with org {user['organization_id']}"
        )
        raise HTTPException(
            status_code=404, detail="No installation found for organization"
        )

    query = (
        db.query(Workflow)
        .options(joinedload(Workflow.repository))
        .filter(Workflow.installation_id == installation.installation_id)
    )

    if repository_name:
        query = query.join(Repository).filter(Repository.name == repository_name)

    if state:
        query = query.filter(Workflow.state == state)

    workflow_stats_subq = (
        db.query(
            WorkflowRun.workflow_id,
            func.count(WorkflowRun.id).label("total_runs"),
            func.sum(case((WorkflowRun.conclusion == "success", 1), else_=0)).label(
                "successful_runs"
            ),
            func.sum(case((WorkflowRun.conclusion == "failure", 1), else_=0)).label(
                "failed_runs"
            ),
            func.max(WorkflowRun.created_at).label("last_run_at"),
        )
        .group_by(WorkflowRun.workflow_id)
        .subquery()
    )

    query = query.outerjoin(
        workflow_stats_subq, Workflow.id == workflow_stats_subq.c.workflow_id
    )
    query = query.order_by(
        desc(workflow_stats_subq.c.last_run_at), desc(Workflow.updated_at)
    )

    total = query.count()

    workflows = query.offset(offset).limit(limit).all()

    workflows_response = []
    for workflow in workflows:
        stats = (
            db.query(
                func.count(WorkflowRun.id).label("total_runs"),
                func.sum(case((WorkflowRun.conclusion == "success", 1), else_=0)).label(
                    "successful_runs"
                ),
                func.sum(case((WorkflowRun.conclusion == "failure", 1), else_=0)).label(
                    "failed_runs"
                ),
                func.max(WorkflowRun.created_at).label("last_run_at"),
            )
            .filter(WorkflowRun.workflow_id == workflow.id)
            .first()
        )

        workflow_data = {
            "id": workflow.id,
            "workflow_id": workflow.workflow_id,
            "name": workflow.name,
            "path": workflow.path,
            "state": workflow.state,
            "created_at": workflow.created_at,
            "updated_at": workflow.updated_at,
            "repository": (
                {
                    "id": workflow.repository.id,
                    "name": workflow.repository.name,
                    "full_name": workflow.repository.full_name,
                    "owner": workflow.repository.owner,
                }
                if workflow.repository
                else None
            ),
            "stats": {
                "total_runs": int(stats.total_runs or 0),
                "successful_runs": int(stats.successful_runs or 0),
                "failed_runs": int(stats.failed_runs or 0),
                "success_rate": round(
                    (stats.successful_runs or 0) / max(stats.total_runs or 1, 1) * 100,
                    1,
                ),
                "last_run_at": stats.last_run_at,
            },
        }
        workflows_response.append(workflow_data)

    return {
        "workflows": workflows_response,
        "total": total,
        "offset": offset,
        "limit": limit,
    }


# TODO: Create response object
# TODO: Update docstring
@router.get("/{workflow_id}")
async def get_workflow_by_id(
    workflow_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(
            f"No installation found for user {user['id']} with org {user['organization_id']}"
        )
        raise HTTPException(
            status_code=404, detail="No installation found for organization"
        )

    workflow = (
        db.query(Workflow)
        .options(joinedload(Workflow.repository))
        .filter(
            Workflow.id == workflow_id,
            Workflow.installation_id == installation.installation_id,
        )
        .first()
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    stats = (
        db.query(
            func.count(WorkflowRun.id).label("total_runs"),
            func.sum(case((WorkflowRun.conclusion == "success", 1), else_=0)).label(
                "successful_runs"
            ),
            func.sum(case((WorkflowRun.conclusion == "failure", 1), else_=0)).label(
                "failed_runs"
            ),
            func.max(WorkflowRun.created_at).label("last_run_at"),
        )
        .filter(WorkflowRun.workflow_id == workflow.id)
        .first()
    )

    workflow_data = {
        "id": workflow.id,
        "workflow_id": workflow.workflow_id,
        "name": workflow.name,
        "path": workflow.path,
        "state": workflow.state,
        "created_at": workflow.created_at,
        "updated_at": workflow.updated_at,
        "content": workflow.content,
        "description": workflow.description,
        "badge_url": workflow.badge_url,
        "repository": (
            {
                "id": workflow.repository.id,
                "name": workflow.repository.name,
                "full_name": workflow.repository.full_name,
                "owner": workflow.repository.owner,
            }
            if workflow.repository
            else None
        ),
        "stats": {
            "total_runs": int(stats.total_runs or 0),
            "successful_runs": int(stats.successful_runs or 0),
            "failed_runs": int(stats.failed_runs or 0),
            "success_rate": round(
                (stats.successful_runs or 0) / max(stats.total_runs or 1, 1) * 100, 1
            ),
            "last_run_at": stats.last_run_at,
        },
    }

    return workflow_data


# TODO: Update docstring
# TODO: Create response object
@router.post("/{workflow_id}/refresh")
async def refresh_workflow_content(
    workflow_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(
            f"No installation found for user {user['id']} with org {user['organization_id']}"
        )
        raise HTTPException(
            status_code=404, detail="No installation found for organization"
        )

    workflow = (
        db.query(Workflow)
        .filter(
            Workflow.id == workflow_id,
            Workflow.installation_id == installation.installation_id,
        )
        .first()
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    try:
        from app.services.workflow_service import WorkflowService

        workflow_service = WorkflowService(db)

        await workflow_service.refresh_workflow_content(workflow_id)

        return {
            "status": "success",
            "message": "Workflow content refreshed successfully",
        }

    except Exception as e:
        logger.error(f"Failed to refresh workflow content: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to refresh workflow content"
        )


# TODO: Update docstring
# TODO: Create response object
@router.get("/status")
async def get_workflow_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(
            f"No installation found for user {user['id']} with org {user['organization_id']}"
        )
        raise HTTPException(
            status_code=404, detail="No installation found for organization"
        )

    total_workflows = (
        db.query(Workflow)
        .filter(Workflow.installation_id == installation.installation_id)
        .count()
    )

    workflows_with_content = (
        db.query(Workflow)
        .filter(
            Workflow.installation_id == installation.installation_id,
            Workflow.content.isnot(None),
            Workflow.content != "",
        )
        .count()
    )

    workflows_without_content = total_workflows - workflows_with_content

    sample_workflows = (
        db.query(Workflow)
        .filter(
            Workflow.installation_id == installation.installation_id,
            (Workflow.content.is_(None)) | (Workflow.content == ""),
        )
        .limit(5)
        .all()
    )

    return {
        "total_workflows": total_workflows,
        "workflows_with_content": workflows_with_content,
        "workflows_without_content": workflows_without_content,
        "sample_workflows_needing_refresh": [
            {
                "id": w.id,
                "name": w.name,
                "path": w.path,
                "has_content": bool(w.content),
                "has_description": bool(w.description),
                "has_badge_url": bool(w.badge_url),
            }
            for w in sample_workflows
        ],
    }


# TODO: Update docstring
@router.post("/refresh-all")
async def refresh_all_workflows(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(
            f"No installation found for user {user['id']} with org {user['organization_id']}"
        )
        raise HTTPException(
            status_code=404, detail="No installation found for organization"
        )

    workflows_without_content = (
        db.query(Workflow)
        .filter(
            Workflow.installation_id == installation.installation_id,
            (Workflow.content.is_(None)) | (Workflow.content == ""),
        )
        .all()
    )

    if not workflows_without_content:
        return {
            "status": "success",
            "message": "All workflows already have content",
            "refreshed_count": 0,
        }

    try:
        from app.services.workflow_service import WorkflowService

        workflow_service = WorkflowService(db)

        success_count = 0
        error_count = 0
        errors = []

        for workflow in workflows_without_content:
            try:
                await workflow_service.refresh_workflow_content(workflow.id)
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append(f"Workflow {workflow.id} ({workflow.name}): {str(e)}")

        return {
            "status": "completed",
            "message": f"Refreshed {success_count} workflows successfully",
            "refreshed_count": success_count,
            "error_count": error_count,
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Failed to refresh workflows: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh workflows")
