from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class RepositoryBase(BaseModel):
    id: int
    name: str
    full_name: str
    owner: str


class JobStepBase(BaseModel):
    id: int
    step_number: int
    name: str
    status: str
    conclusion: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class JobBase(BaseModel):
    id: int
    job_id: str
    job_name: str
    status: str
    conclusion: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    url: str
    steps: List["JobStepBase"] = []


class WorkflowRunResponse(BaseModel):
    id: int
    run_id: str
    run_attempt: int
    run_number: int
    workflow_name: str
    event: str
    status: str
    conclusion: Optional[str] = None
    head_branch: Optional[str] = None
    head_sha: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    url: str
    repository: Optional[RepositoryBase] = None
    jobs: List[JobBase] = []

    class Config:
        from_attributes = True


class WorkflowRunListResponse(BaseModel):
    workflow_runs: List[WorkflowRunResponse]
    total: int
    offset: int
    limit: int


class WorkflowRunSummary(BaseModel):
    id: int
    run_id: str
    run_number: int
    workflow_name: str
    repository_name: str
    repository_full_name: str
    status: str
    conclusion: Optional[str]
    event: str
    head_branch: str
    head_sha: str
    url: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]


class JobSummary(BaseModel):
    id: int
    job_id: str
    job_name: str
    status: str
    conclusion: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]
    runner_name: Optional[str]


class DashboardStats(BaseModel):
    total_runs: int
    successful_runs: int
    failed_runs: int
    in_progress_runs: int
    total_repositories: int
    avg_duration_minutes: Optional[float]
