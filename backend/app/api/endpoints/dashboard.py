from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.db.session import get_db
from app.db.models.job import WorkflowRun, Job
from app.db.models.repository import Repository
from app.db.models.installation import Installation
from app.api.dependencies import get_current_user
from app.schemas.user import User
from app.schemas.workflow_run import WorkflowRunSummary, JobSummary, DashboardStats

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    days: int = Query(7, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve aggregated dashboard statistics for the authenticated user's organization.

    Args:
        days (int): Number of days to include in the statistics (default: 7, min: 1, max: 90).
        user (User): The current authenticated user, injected by dependency.
        db (Session): SQLAlchemy database session, injected by dependency.

    Returns:
        DashboardStats

    Notes:
        - If no installation is found for the user's organization, returns zeroed stats.
        - Only considers workflow runs associated with the user's installation.
        -
    """

    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(
            f"No installation found for user {user['id']} with org {user['organization_id']}"
        )
        return DashboardStats(
            total_runs=0,
            successful_runs=0,
            failed_runs=0,
            in_progress_runs=0,
            total_repositories=0,
            avg_duration_minutes=None,
        )

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    base_query = db.query(WorkflowRun).filter(
        WorkflowRun.started_at >= start_date,
        WorkflowRun.installation_id == installation.installation_id,
    )

    all_runs = base_query.all()

    total_runs = len(all_runs)
    successful_runs = len([r for r in all_runs if r.conclusion == "success"])
    failed_runs = len([r for r in all_runs if r.conclusion == "failure"])
    in_progress_runs = len(
        [r for r in all_runs if r.status in ["queued", "in_progress"]]
    )

    total_repositories = (
        db.query(Repository.id)
        .filter(Repository.installation_id == installation.installation_id)
        .count()
    )

    completed_runs = [r for r in all_runs if r.started_at and r.completed_at]
    avg_duration_minutes = None
    if completed_runs:
        total_duration = sum(
            [
                (run.completed_at - run.started_at).total_seconds()
                for run in completed_runs
            ]
        )
        avg_duration_minutes = (total_duration / len(completed_runs)) / 60

    return DashboardStats(
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        in_progress_runs=in_progress_runs,
        total_repositories=total_repositories,
        avg_duration_minutes=avg_duration_minutes,
    )


@router.get("/workflow-runs", response_model=List[WorkflowRunSummary])
async def get_workflow_runs(
    repository_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    conclusion: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve a paginated list of workflow runs for the authenticated user's organization,
    with optional filters for repository, status, and conclusion.

    Args:
        repository_id (Optional[int]): Filter runs by repository ID.
        status (Optional[str]): Filter runs by status (e.g., 'queued', 'in_progress', 'completed').
        conclusion (Optional[str]): Filter runs by conclusion (e.g., 'success', 'failure').
        limit (int): Maximum number of runs to return (default: 50, min: 1, max: 200).
        offset (int): Number of runs to skip for pagination (default: 0).
        user (User): The current authenticated user, injected by dependency.
        db (Session): SQLAlchemy database session, injected by dependency.

    Returns:
        List[WorkflowRunSummary]: List of workflow run summaries, ordered by most recent.

    Notes:
        - Only returns runs associated with the user's installation.
        - Includes repository name and full name for each run.
        - Duration is calculated for completed runs.
    """

    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(
            f"No installation found for user {user['id']} with org {user['organization_id']}"
        )
        return []

    query = (
        db.query(
            WorkflowRun,
            Repository.name.label("repo_name"),
            Repository.full_name.label("repo_full_name"),
        )
        .join(Repository, WorkflowRun.repository_id == Repository.id)
        .filter(WorkflowRun.installation_id == installation.installation_id)
    )

    if repository_id:
        query = query.filter(WorkflowRun.repository_id == repository_id)

    if status:
        query = query.filter(WorkflowRun.status == status)

    if conclusion:
        query = query.filter(WorkflowRun.conclusion == conclusion)

    query = query.order_by(desc(WorkflowRun.started_at))

    results = query.offset(offset).limit(limit).all()

    workflow_runs = []
    for result in results:
        run = result[0]
        repo_name = result[1]
        repo_full_name = result[2]

        duration_seconds = None
        if run.started_at and run.completed_at:
            duration_seconds = int((run.completed_at - run.started_at).total_seconds())

        workflow_runs.append(
            WorkflowRunSummary(
                id=run.id,
                run_id=run.run_id,
                run_number=run.run_number,
                workflow_name=run.workflow_name,
                repository_name=repo_name,
                repository_full_name=repo_full_name,
                status=run.status,
                conclusion=run.conclusion,
                event=run.event,
                head_branch=run.head_branch,
                head_sha=run.head_sha[:7] if run.head_sha else "",  # Short SHA
                url=run.url,
                started_at=run.started_at,
                completed_at=run.completed_at,
                duration_seconds=duration_seconds,
            )
        )

    return workflow_runs


@router.get("/workflow-runs/{run_id}/jobs", response_model=List[JobSummary])
async def get_workflow_run_jobs(run_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all jobs for a specific workflow run.

    Args:
        run_id (str): The unique identifier of the workflow run.
        db (Session): SQLAlchemy database session, injected by dependency.

    Returns:
        List[JobSummary]: List of job summaries for the specified workflow run.

    Raises:
        HTTPException: If the workflow run is not found (404).

    Notes:
        - Duration is calculated for completed jobs.
        - Runner name is extracted from job raw_data if available.
    """

    workflow_run = db.query(WorkflowRun).filter(WorkflowRun.run_id == run_id).first()
    if not workflow_run:
        raise HTTPException(status_code=404, detail="Workflow run not found")

    jobs = db.query(Job).filter(Job.workflow_run_id == workflow_run.id).all()

    job_summaries = []
    for job in jobs:
        duration_seconds = None
        if job.started_at and job.completed_at:
            duration_seconds = int((job.completed_at - job.started_at).total_seconds())

        runner_name = None
        if job.raw_data and isinstance(job.raw_data, dict):
            runner_name = job.raw_data.get("runner_name")

        job_summaries.append(
            JobSummary(
                id=job.id,
                job_id=job.job_id,
                job_name=job.job_name,
                status=job.status,
                conclusion=job.conclusion,
                started_at=job.started_at,
                completed_at=job.completed_at,
                duration_seconds=duration_seconds,
                runner_name=runner_name,
            )
        )

    return job_summaries


# TODO: Create response object
@router.get("/repositories")
async def get_repositories(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Retrieve all repositories for the authenticated user's organization that have recent activity,
    along with summary statistics for each repository.

    Args:
        user (User): The current authenticated user, injected by dependency.
        db (Session): SQLAlchemy database session, injected by dependency.

    Returns:
        List[dict]: List of repositories with recent workflow run activity (last 30 days),
        including total runs, successful runs, failed runs, success rate, and last run timestamp.

    Notes:
        - Only includes repositories with at least one workflow run in the last 30 days.
        - Success rate is calculated as (successful_runs / total_runs) * 100.
    """

    installation: Installation = (
        db.query(Installation)
        .filter(Installation.organization_id == user["organization_id"])
        .first()
    )

    if not installation:
        logger.warning(
            f"No installation found for user {user['id']} with org {user['organization_id']}"
        )
        return []

    repositories = (
        db.query(Repository)
        .filter(Repository.installation_id == installation.installation_id)
        .all()
    )

    result = []
    for repo in repositories:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        runs = (
            db.query(WorkflowRun)
            .filter(
                WorkflowRun.repository_id == repo.id,
                WorkflowRun.started_at >= thirty_days_ago,
            )
            .all()
        )

        if not runs:
            continue

        total_runs = len(runs)
        successful_runs = len([r for r in runs if r.conclusion == "success"])
        failed_runs = len([r for r in runs if r.conclusion == "failure"])
        success_rate = (successful_runs / total_runs * 100) if total_runs > 0 else 0
        last_run_at = max([r.started_at for r in runs if r.started_at], default=None)

        result.append(
            {
                "id": repo.id,
                "name": repo.name,
                "full_name": repo.full_name,
                "owner": repo.owner,
                "total_runs": total_runs,
                "successful_runs": successful_runs,
                "failed_runs": failed_runs,
                "success_rate": round(success_rate, 1),
                "last_run_at": last_run_at,
            }
        )

    return result
