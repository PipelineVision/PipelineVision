from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.db.session import get_db
from app.db.models.job import Job, JobLog
from app.schemas.job import JobLogResponse, JobLogStreamResponse
from app.services.workflow_service import WorkflowService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/jobs/{job_id}/logs", response_model=List[JobLogResponse])
async def get_job_logs(
    job_id: int,
    db: Session = Depends(get_db),
    step_number: Optional[int] = Query(None, description="Filter logs by step number"),
    line_start: Optional[int] = Query(None, description="Start from line number"),
    line_end: Optional[int] = Query(None, description="End at line number"),
    limit: Optional[int] = Query(1000, description="Maximum number of log lines"),
):
    """
    Get logs for a specific job.

    Args:
        job_id: The database job ID
        step_number: Optional filter by step number
        line_start: Optional start line number
        line_end: Optional end line number
        limit: Maximum number of log lines (default 1000)

    Raises:
        HTTPException: If no logs found for the job (404)
        HTTPException: Failed to fetch job lobs (500)
    """
    try:

        query = db.query(JobLog).filter(JobLog.job_id == job_id)

        total_logs = query.count()

        if total_logs == 0:
            raise HTTPException(status_code=404, detail="No logs found for this job")

        if step_number is not None:
            query = query.filter(JobLog.step_number == step_number)

        if line_start is not None:
            query = query.filter(JobLog.line_number >= line_start)

        if line_end is not None:
            query = query.filter(JobLog.line_number <= line_end)

        logs = query.order_by(JobLog.line_number).limit(limit).all()

        return logs

    except Exception as e:
        logger.error(f"Error fetching logs for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job logs")


@router.get("/jobs/{job_id}/logs/stream", response_model=JobLogStreamResponse)
async def get_job_logs_stream(
    job_id: int,
    db: Session = Depends(get_db),
    from_line: int = Query(0, description="Start from line number for streaming"),
):
    """
    Get logs for streaming - returns logs from a specific line number onwards.

    Args:
        job_id: The database job ID
        from_line: Line number to start from (for incremental fetching)

    Raises:
        HTTPException: Failed to stream job logs (500)
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        logs = (
            db.query(JobLog)
            .filter(JobLog.job_id == job_id)
            .filter(JobLog.line_number > from_line)
            .order_by(JobLog.line_number)
            .all()
        )

        total_lines = db.query(JobLog).filter(JobLog.job_id == job_id).count()

        is_complete = job.status in ["completed", "failed", "cancelled"]

        return JobLogStreamResponse(
            logs=logs,
            total_lines=total_lines,
            from_line=from_line,
            is_complete=is_complete,
            job_status=job.status,
        )

    except Exception as e:
        logger.error(f"Error streaming logs for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to stream job logs")


@router.post("/jobs/{job_id}/logs/refresh")
async def refresh_job_logs(job_id: int, db: Session = Depends(get_db)):
    """
    Manually trigger a refresh of job logs from GitHub.

    Args:
        job_id: The database job ID

    Raises:
        HTTPException: Failed to refresh job logs (500)
    """
    try:
        # Verify job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Trigger log collection
        workflow_service = WorkflowService(db)
        await workflow_service.fetch_and_store_job_logs(job_id, force_refresh=True)

        return {"message": "Log refresh initiated", "job_id": job_id}

    except Exception as e:
        logger.error(f"Error refreshing logs for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh job logs")


@router.get("/jobs/{job_id}/logs/raw")
async def get_job_logs_raw(job_id: int, db: Session = Depends(get_db)):
    """
    Get raw log content as plain text.

    Args:
        job_id: The database job ID

    Raises:
        HTTPException: Failed to fetch raw job logs (500)
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        logs = (
            db.query(JobLog)
            .filter(JobLog.job_id == job_id)
            .order_by(JobLog.line_number)
            .all()
        )

        if not logs:
            return {"content": "", "total_lines": 0}

        content = "\n".join(log.content for log in logs)

        return {
            "content": content,
            "total_lines": len(logs),
            "job_name": job.job_name,
            "job_status": job.status,
        }

    except Exception as e:
        logger.error(f"Error fetching raw logs for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch raw job logs")
