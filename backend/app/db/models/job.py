from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    DateTime,
    JSON,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
import datetime

from app.db.session import Base


# TODO: Fix issue with 404 for workflow yaml file
class Workflow(Base):
    """
    Represents a GitHub workflow (.yml file).

    Attributes:
        id (int): The unique identifier for the workflow in the database.
        workflow_id (str): The unique GitHub workflow ID.
        repository_id (int): The ID of the repository containing the workflow.
        installation_id (int): The ID of the GitHub App installation.
        name (str): The name of the workflow.
        path (str): The path to the workflow file (e.g., .github/workflows/ci.yml).
        state (str): The state of the workflow (active, disabled, etc.).
        created_at (datetime): When the workflow record was created.
        updated_at (datetime): When the workflow record was last updated.

    Relationships:
        repository (Repository): The repository containing the workflow.
        installation (Installation): The GitHub App installation.
        workflow_runs (list[WorkflowRun]): All runs of this workflow.
    """

    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(String, unique=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    installation_id = Column(
        Integer, ForeignKey("installations.installation_id", ondelete="CASCADE")
    )
    name = Column(String)
    path = Column(String)
    state = Column(String)
    content = Column(Text, nullable=True)
    description = Column(String, nullable=True)
    badge_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    repository = relationship("Repository", back_populates="workflows")
    installation = relationship("Installation", back_populates="workflows")
    workflow_runs = relationship("WorkflowRun", back_populates="workflow")


class WorkflowRun(Base):
    """
    Represents a specific execution/run of a GitHub workflow.

    Attributes:
        id (int): The unique identifier for the workflow run in the database.
        run_id (str): The GitHub workflow run ID (not unique, as runs can be re-run).
        run_attempt (int): The attempt number for this run (1, 2, 3, etc.).
        workflow_id (int): The ID of the workflow being run.
        repository_id (int): The ID of the repository.
        installation_id (int): The ID of the GitHub App installation.
        run_number (int): The run number for this workflow in the repository.
        event (str): The event that triggered the run (push, pull_request, schedule, etc.).
        status (str): The current status (queued, in_progress, completed).
        conclusion (str): The conclusion (success, failure, cancelled, etc.).
        workflow_name (str): The name of the workflow (for quick access).
        head_branch (str): The branch that triggered the run.
        head_sha (str): The commit SHA that triggered the run.
        started_at (datetime): When the workflow run started.
        completed_at (datetime): When the workflow run completed.
        url (str): The GitHub URL for this workflow run.
        raw_data (JSON): The full webhook payload.
        created_at (datetime): When the record was created.
        updated_at (datetime): When the record was last updated.

    Relationships:
        workflow (Workflow): The workflow definition.
        repository (Repository): The repository.
        installation (Installation): The GitHub App installation.
        jobs (list[Job]): All jobs in this workflow run.
    """

    __tablename__ = "workflow_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, index=True)
    run_attempt = Column(Integer, default=1)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    installation_id = Column(
        Integer, ForeignKey("installations.installation_id", ondelete="CASCADE")
    )
    run_number = Column(Integer)
    event = Column(String)
    status = Column(String)
    conclusion = Column(String, nullable=True)
    workflow_name = Column(String)
    head_branch = Column(String, nullable=True)
    head_sha = Column(String)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    url = Column(String)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint("run_id", "run_attempt", name="unique_run_id_attempt"),
    )

    workflow = relationship("Workflow", back_populates="workflow_runs")
    repository = relationship("Repository", back_populates="workflow_runs")
    installation = relationship("Installation", back_populates="workflow_runs")
    jobs = relationship("Job", back_populates="workflow_run")


class Job(Base):
    """
    Represents a GitHub workflow job within a workflow run.

    Attributes:
        id (int): The unique identifier for the job in the database.
        job_id (str): The unique GitHub job ID.
        run_id (str): The GitHub workflow run ID this job belongs to.
        run_attempt (int): The attempt number of the workflow run.
        workflow_run_id (int): The ID of the workflow run containing this job (legacy).
        repository_id (int): The ID of the repository (denormalized for queries).
        installation_id (int): The ID of the GitHub App installation (denormalized).
        runner_id (int): The ID of the runner assigned to the job (nullable).
        job_name (str): The name of the job.
        status (str): The current status of the job.
        conclusion (str): The conclusion of the job (nullable).
        started_at (datetime): When the job started (nullable).
        completed_at (datetime): When the job completed (nullable).
        url (str): The URL of the job in GitHub.
        raw_data (JSON): The full webhook payload (nullable).
        created_at (datetime): When the job record was created.
        updated_at (datetime): When the job record was last updated.

    Relationships:
        workflow_run (WorkflowRun): The workflow run containing this job.
        repository (Repository): The repository (via workflow_run, but denormalized).
        installation (Installation): The GitHub App installation.
        runner (Runner): The runner assigned to the job.
        steps (list[JobStep]): All steps in this job.
    """

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True)
    run_id = Column(String, index=True)
    run_attempt = Column(Integer, default=1)
    workflow_run_id = Column(Integer, ForeignKey("workflow_runs.id"), nullable=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    installation_id = Column(
        Integer, ForeignKey("installations.installation_id", ondelete="CASCADE")
    )
    runner_id = Column(Integer, ForeignKey("runners.id"), nullable=True)
    job_name = Column(String)
    status = Column(String)
    conclusion = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    url = Column(String)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    workflow_run = relationship("WorkflowRun", back_populates="jobs")
    repository = relationship("Repository", back_populates="jobs")
    installation = relationship("Installation", back_populates="jobs")
    runner = relationship("Runner", back_populates="jobs")
    steps = relationship("JobStep", back_populates="job")
    logs = relationship("JobLog", back_populates="job", cascade="all, delete-orphan")


class JobStep(Base):
    """
    Represents an individual step within a job.

    Attributes:
        id (int): The unique identifier for the step in the database.
        step_number (int): The order of this step in the job.
        job_id (int): The ID of the job containing this step.
        name (str): The name of the step.
        status (str): The status of the step.
        conclusion (str): The conclusion of the step.
        started_at (datetime): When the step started.
        completed_at (datetime): When the step completed.
        created_at (datetime): When the record was created.
        updated_at (datetime): When the record was last updated.

    Relationships:
        job (Job): The job containing this step.
    """

    __tablename__ = "job_steps"

    id = Column(Integer, primary_key=True, index=True)
    step_number = Column(Integer)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    name = Column(String)
    status = Column(String)
    conclusion = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    job = relationship("Job", back_populates="steps")


class JobLog(Base):
    """
    Represents individual log lines from GitHub Actions job execution.

    Attributes:
        id (int): The unique identifier for the log line in the database.
        job_id (int): The ID of the job this log line belongs to.
        step_number (int): The step number this log belongs to (nullable for job-level logs).
        line_number (int): The sequential line number within the job logs.
        timestamp (datetime): When this log line was generated.
        content (str): The actual log content/message.
        created_at (datetime): When this log record was stored in our database.

    Relationships:
        job (Job): The job this log line belongs to.
    """

    __tablename__ = "job_logs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=True)
    line_number = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("job_id", "line_number", name="unique_job_line"),
    )

    job = relationship("Job", back_populates="logs")
