import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, or_

from app.api.dependencies import get_current_user
from app.db.models.installation import Installation
from app.db.models.job import WorkflowRun, Job
from app.db.models.repository import Repository
from app.schemas.user import User
from app.schemas.workflow_run import (
    WorkflowRunResponse,
    WorkflowRunListResponse,
    RepositoryBase,
    JobBase,
    JobStepBase,
)
from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


# TODO: Update docstring
@router.get("/", response_model=WorkflowRunListResponse)
async def get_workflow_runs(
    status: Optional[str] = Query(
        None, description="Filter by status (queued, in_progress, completed)"
    ),
    conclusion: Optional[str] = Query(
        None, description="Filter by conclusion (success, failure, cancelled)"
    ),
    event: Optional[str] = Query(
        None, description="Filter by event (push, pull_request, schedule, etc.)"
    ),
    workflow_name: Optional[str] = Query(None, description="Filter by workflow name"),
    repository_name: Optional[str] = Query(
        None, description="Filter by repository name"
    ),
    repository_full_name: Optional[str] = Query(
        None, description="Filter by full repository name"
    ),
    head_branch: Optional[str] = Query(None, description="Filter by head branch"),
    created_after: Optional[datetime] = Query(
        None, description="Filter runs created after this date"
    ),
    created_before: Optional[datetime] = Query(
        None, description="Filter runs created before this date"
    ),
    started_after: Optional[datetime] = Query(
        None, description="Filter runs started after this date"
    ),
    started_before: Optional[datetime] = Query(
        None, description="Filter runs started before this date"
    ),
    completed_after: Optional[datetime] = Query(
        None, description="Filter runs completed after this date"
    ),
    completed_before: Optional[datetime] = Query(
        None, description="Filter runs completed before this date"
    ),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        50, ge=1, le=1000, description="Number of records to return (max 1000)"
    ),
    sort_by: str = Query("created_at", description="Field to sort by"),
    order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
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
        all_installations = db.query(Installation).all()
        logger.info(
            f"All installations: {[(i.installation_id, i.organization_id) for i in all_installations]}"
        )
        raise HTTPException(
            status_code=404, detail="No installation found for organization"
        )

    logger.info(
        f"Found installation {installation.installation_id} for user {user['id']}"
    )

    query = (
        db.query(WorkflowRun)
        .options(joinedload(WorkflowRun.repository))
        .filter(WorkflowRun.installation_id == installation.installation_id)
    )

    if status:
        query = query.filter(WorkflowRun.status == status)
    if conclusion:
        query = query.filter(WorkflowRun.conclusion == conclusion)
    if event:
        query = query.filter(WorkflowRun.event == event)
    if workflow_name:
        query = query.filter(WorkflowRun.workflow_name.ilike(f"%{workflow_name}%"))
    if head_branch:
        query = query.filter(WorkflowRun.head_branch.ilike(f"%{head_branch}%"))

    if repository_name or repository_full_name:
        query = query.join(Repository)
        if repository_name:
            query = query.filter(Repository.name == repository_name)
        if repository_full_name:
            query = query.filter(Repository.full_name == repository_full_name)

    if created_after:
        query = query.filter(WorkflowRun.created_at >= created_after)
    if created_before:
        query = query.filter(WorkflowRun.created_at <= created_before)
    if started_after:
        query = query.filter(WorkflowRun.started_at >= started_after)
    if started_before:
        query = query.filter(WorkflowRun.started_at <= started_before)
    if completed_after:
        query = query.filter(WorkflowRun.completed_at >= completed_after)
    if completed_before:
        query = query.filter(WorkflowRun.completed_at <= completed_before)

    if hasattr(WorkflowRun, sort_by):
        sort_column = getattr(WorkflowRun, sort_by)
        if order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(desc(WorkflowRun.created_at))

    total = query.count()
    logger.info(f"Total workflow runs found: {total}")

    workflow_runs = query.offset(offset).limit(limit).all()
    logger.info(f"Returned {len(workflow_runs)} workflow runs after pagination")

    if workflow_runs:
        run_identifiers = [(run.run_id, run.run_attempt) for run in workflow_runs]

        job_filters = []
        for run_id, run_attempt in run_identifiers:
            job_filters.append(
                (Job.run_id == run_id) & (Job.run_attempt == run_attempt)
            )

        all_jobs = db.query(Job).filter(or_(*job_filters)).all() if job_filters else []

        jobs_by_run = {}
        for job in all_jobs:
            key = (job.run_id, job.run_attempt)
            if key not in jobs_by_run:
                jobs_by_run[key] = []
            jobs_by_run[key].append(job)
    else:
        jobs_by_run = {}

    workflow_runs_response = []
    for run in workflow_runs:
        repository_data = None
        if run.repository:
            repository_data = RepositoryBase(
                id=run.repository.id,
                name=run.repository.name,
                full_name=run.repository.full_name,
                owner=run.repository.owner,
            )

        run_key = (run.run_id, run.run_attempt)
        run_jobs = jobs_by_run.get(run_key, [])

        jobs_data = []
        for job in run_jobs[:10]:
            jobs_data.append(
                JobBase(
                    id=job.id,
                    job_id=job.job_id,
                    job_name=job.job_name,
                    status=job.status,
                    conclusion=job.conclusion,
                    started_at=job.started_at,
                    completed_at=job.completed_at,
                    url=job.url,
                )
            )

        run_data = WorkflowRunResponse(
            id=run.id,
            run_id=run.run_id,
            run_attempt=run.run_attempt,
            run_number=run.run_number,
            workflow_name=run.workflow_name,
            event=run.event,
            status=run.status,
            conclusion=run.conclusion,
            head_branch=run.head_branch,
            head_sha=run.head_sha,
            started_at=run.started_at,
            completed_at=run.completed_at,
            created_at=run.created_at,
            updated_at=run.updated_at,
            url=run.url,
            repository=repository_data,
            jobs=jobs_data,
        )
        workflow_runs_response.append(run_data)

    return WorkflowRunListResponse(
        workflow_runs=workflow_runs_response, total=total, offset=offset, limit=limit
    )


# TODO: Update docstring
@router.get("/{run_id}", response_model=WorkflowRunResponse)
async def get_workflow_run_by_id(
    run_id: str,
    run_attempt: Optional[int] = Query(
        None, description="Specific attempt number (defaults to latest)"
    ),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    logger.info(
        f"Fetching workflow run details for run_id: {run_id}, attempt: {run_attempt}, user: {user['id']}"
    )

    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        raise HTTPException(
            status_code=404, detail="No installation found for organization"
        )

    query = (
        db.query(WorkflowRun)
        .options(joinedload(WorkflowRun.repository))
        .filter(
            WorkflowRun.run_id == run_id,
            WorkflowRun.installation_id == installation.installation_id,
        )
    )

    if run_attempt is not None:
        query = query.filter(WorkflowRun.run_attempt == run_attempt)
        workflow_run = query.first()
    else:
        workflow_run = query.order_by(WorkflowRun.run_attempt.desc()).first()

    if not workflow_run:
        logger.warning(
            f"Workflow run not found for run_id: {run_id}, attempt: {run_attempt}, installation: {installation.installation_id}"
        )
        raise HTTPException(status_code=404, detail="Workflow run not found")

    jobs = (
        db.query(Job)
        .options(joinedload(Job.steps))
        .filter(
            Job.run_id == workflow_run.run_id,
            Job.run_attempt == workflow_run.run_attempt,
        )
        .all()
    )
    workflow_run.jobs = jobs

    repository_data = None
    if workflow_run.repository:
        repository_data = RepositoryBase(
            id=workflow_run.repository.id,
            name=workflow_run.repository.name,
            full_name=workflow_run.repository.full_name,
            owner=workflow_run.repository.owner,
        )

    jobs_data = []
    for job in workflow_run.jobs:
        steps_data = []
        for step in job.steps:
            steps_data.append(
                JobStepBase(
                    id=step.id,
                    step_number=step.step_number,
                    name=step.name,
                    status=step.status,
                    conclusion=step.conclusion,
                    started_at=step.started_at,
                    completed_at=step.completed_at,
                )
            )

        jobs_data.append(
            JobBase(
                id=job.id,
                job_id=job.job_id,
                job_name=job.job_name,
                status=job.status,
                conclusion=job.conclusion,
                started_at=job.started_at,
                completed_at=job.completed_at,
                url=job.url,
                steps=steps_data,
            )
        )

    return WorkflowRunResponse(
        id=workflow_run.id,
        run_id=workflow_run.run_id,
        run_attempt=workflow_run.run_attempt,
        run_number=workflow_run.run_number,
        workflow_name=workflow_run.workflow_name,
        event=workflow_run.event,
        status=workflow_run.status,
        conclusion=workflow_run.conclusion,
        head_branch=workflow_run.head_branch,
        head_sha=workflow_run.head_sha,
        started_at=workflow_run.started_at,
        completed_at=workflow_run.completed_at,
        created_at=workflow_run.created_at,
        updated_at=workflow_run.updated_at,
        url=workflow_run.url,
        repository=repository_data,
        jobs=jobs_data,
    )
