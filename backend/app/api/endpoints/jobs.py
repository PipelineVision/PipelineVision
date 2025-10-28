from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.db.session import get_db
from app.db.models.job import Job, JobStep
from app.schemas.job import JobResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[JobResponse])
async def get_jobs(
    db: Session = Depends(get_db),
    limit: int = Query(100, description="Maximum number of jobs to return"),
    offset: int = Query(0, description="Number of jobs to skip"),
    status: Optional[str] = Query(None, description="Filter by job status"),
    workflow_name: Optional[str] = Query(None, description="Filter by workflow name"),
):
    """
    Get a list of jobs with optional filtering.

    Args:
        limit: Maximum number of jobs to return (default 100)
        offset: Number of jobs to skip for pagination (default 0)
        status: Optional status filter (queued, in_progress, completed)
        workflow_name: Optional workflow name filter

    Raises:
        HTTPException: Failed to fetch jobs (500)
    """
    try:
        query = db.query(Job)

        if status:
            query = query.filter(Job.status == status)

        if workflow_name:
            query = query.filter(Job.workflow_name.ilike(f"%{workflow_name}%"))

        query = query.order_by(Job.created_at.desc())

        jobs = query.offset(offset).limit(limit).all()

        logger.info(
            f"Retrieved {len(jobs)} jobs with filters: status={status}, workflow_name={workflow_name}"
        )
        return jobs

    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    """
    Get a specific job by database ID.

    Args:
        job_id: The database job ID

    Raises:
        HTTPException: Failed to fetch job (500)
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        return job

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job")


@router.get("/{job_id}/status")
async def get_job_status(job_id: int, db: Session = Depends(get_db)):
    """
    Get just the status of a specific job

    Args:
        job_id: The database job ID

    Raises:
        HTTPException: Failed to fetch job status (500)
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        return {
            "id": job.id,
            "job_id": job.job_id,
            "status": job.status,
            "conclusion": job.conclusion,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job status {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job status")


@router.get("/{job_id}/steps")
async def get_job_steps(job_id: int, db: Session = Depends(get_db)):
    """
    Get steps for a specific job.

    Args:
        job_id: The database job ID

    Raises:
        HTTPException: Failed to fetch job (500)
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        steps = (
            db.query(JobStep)
            .filter(JobStep.job_id == job_id)
            .order_by(JobStep.step_number)
            .all()
        )

        return steps

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job steps {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job steps")
