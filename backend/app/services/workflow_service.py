import asyncio
import base64
import logging
import yaml
import re


import urllib.parse


import httpx

from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.models.job import Workflow, WorkflowRun, Job, JobStep, JobLog
from app.db.models.repository import Repository
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)


class WorkflowService:
    """
    Service for managing workflows, workflow runs, and fetching YAML content.

    Handles:
    - Processing workflow_run webhook events
    - Processing workflow_job webhook events
    - Fetching workflow YAML content from GitHub
    - Syncing workflow definitions when files change
    """

    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService(db)

    async def process_workflow_run_event(
        self, installation_id: int, workflow_run: Dict, repository_data: Dict
    ):
        """Process a GitHub workflow_run webhook event"""
        try:
            logger.info(
                f"Processing workflow_run event for run {workflow_run['id']}, installation {installation_id}"
            )

            repo = await self._get_or_create_repository(
                repository_data, installation_id
            )

            workflow = await self._get_or_create_workflow(
                workflow_run, repo.id, installation_id
            )

            run = await self._create_or_update_workflow_run(
                workflow_run, workflow.id, repo.id, installation_id
            )

            logger.info(
                f"Successfully processed workflow_run {run.run_id} for workflow {workflow.name}"
            )
            return run

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing workflow_run event: {e}")
            raise

    async def process_workflow_job_event(
        self, installation_id: int, workflow_job: Dict, repository_data: Dict
    ):
        """Process a GitHub workflow_job webhook event"""
        try:
            logger.info(
                f"Processing workflow_job event for job {workflow_job['id']}, installation {installation_id}"
            )

            repo = await self._get_or_create_repository(
                repository_data, installation_id
            )

            job = await self._create_or_update_job(
                workflow_job, repo.id, installation_id
            )

            if workflow_job.get("steps"):
                await self._create_or_update_job_steps(workflow_job["steps"], job.id)

            job_status = workflow_job.get("status")
            if job_status == "completed":
                logger.info(f"Job {job.job_id} completed, triggering log collection")
                asyncio.create_task(self.fetch_and_store_job_logs(job.id))
            elif job_status == "in_progress":
                logger.debug(
                    f"Job {job.job_id} in progress, logs will be collected on completion"
                )

            logger.info(f"Successfully processed workflow_job {job.job_id}")
            return job

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing workflow_job event: {e}")
            raise

    async def refresh_workflow_content(self, workflow_id: int):
        """Refresh YAML content, description, and badge URL for a specific workflow"""
        try:
            workflow = (
                self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
            )
            if not workflow:
                raise Exception(f"Workflow {workflow_id} not found")

            repo = (
                self.db.query(Repository)
                .filter(Repository.id == workflow.repository_id)
                .first()
            )
            if not repo:
                raise Exception(f"Repository for workflow {workflow_id} not found")

            logger.info(
                f"Refreshing content for workflow {workflow.name} at {workflow.path}"
            )

            content, description = await self._fetch_workflow_content_from_github(
                repo.full_name, workflow.path, workflow.installation_id
            )

            if content:
                workflow.content = content
                workflow.description = description
                workflow.badge_url = self._generate_badge_url(
                    repo.full_name, workflow.name
                )
                workflow.updated_at = datetime.utcnow()

                self.db.add(workflow)
                self.db.commit()

                logger.info(
                    f"Successfully refreshed content for workflow {workflow.name}"
                )
            else:
                logger.warning(f"Could not fetch content for workflow {workflow.name}")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error refreshing workflow content: {e}")
            raise

    async def sync_workflows_for_repository(
        self, repository_full_name: str, installation_id: int
    ):
        """
        Sync all workflows for a repository by fetching from GitHub API.
        Useful when repository workflows change via push events.
        """
        try:
            logger.info(f"Syncing workflows for repository {repository_full_name}")

            repo = (
                self.db.query(Repository)
                .filter(Repository.full_name == repository_full_name)
                .filter(Repository.installation_id == installation_id)
                .first()
            )

            if not repo:
                logger.warning(
                    f"Repository {repository_full_name} not found in database"
                )
                return

            workflows_data = await self._fetch_workflows_from_github(
                repository_full_name, installation_id
            )

            for workflow_data in workflows_data:
                await self._sync_workflow_from_github_data(
                    workflow_data, repo.id, installation_id
                )

            logger.info(
                f"Successfully synced {len(workflows_data)} workflows for {repository_full_name}"
            )

        except Exception as e:
            logger.error(
                f"Error syncing workflows for repository {repository_full_name}: {e}"
            )
            raise

    async def _get_or_create_repository(
        self, repository_data: Dict, installation_id: int
    ) -> Repository:
        """Get or create repository record"""
        repo = (
            self.db.query(Repository)
            .filter(Repository.github_id == repository_data["id"])
            .first()
        )

        if not repo:
            repo = Repository(
                github_id=repository_data["id"],
                name=repository_data["name"],
                full_name=repository_data["full_name"],
                owner=repository_data["owner"]["login"],
                installation_id=installation_id,
            )
            self.db.add(repo)
            self.db.commit()
            self.db.refresh(repo)
        elif not repo.installation_id:
            repo.installation_id = installation_id
            self.db.add(repo)
            self.db.commit()

        return repo

    async def _get_or_create_workflow(
        self, workflow_run: Dict, repository_id: int, installation_id: int
    ) -> Workflow:
        """Get or create workflow definition"""
        workflow = (
            self.db.query(Workflow)
            .filter(Workflow.workflow_id == str(workflow_run["workflow_id"]))
            .first()
        )

        if not workflow:
            workflow = Workflow(
                workflow_id=str(workflow_run["workflow_id"]),
                repository_id=repository_id,
                installation_id=installation_id,
                name=workflow_run["name"],
                path=workflow_run.get(
                    "path",
                    f".github/workflows/{workflow_run['name'].lower().replace(' ', '-')}.yml",
                ),
                state="active",
            )
            self.db.add(workflow)
            self.db.commit()
            self.db.refresh(workflow)

            logger.debug(
                f"Skipping content fetch for workflow {workflow.name} (disabled to avoid permission issues)"
            )

        return workflow

    async def _create_or_update_workflow_run(
        self,
        workflow_run: Dict,
        workflow_id: int,
        repository_id: int,
        installation_id: int,
    ) -> WorkflowRun:
        """Create or update workflow run record"""
        run_id = str(workflow_run["id"])
        run_attempt = workflow_run.get("run_attempt", 1)

        run = (
            self.db.query(WorkflowRun)
            .filter(
                WorkflowRun.run_id == run_id, WorkflowRun.run_attempt == run_attempt
            )
            .first()
        )

        if not run:
            run = WorkflowRun(
                run_id=run_id,
                run_attempt=run_attempt,
                workflow_id=workflow_id,
                repository_id=repository_id,
                installation_id=installation_id,
            )

        # Update run data
        run.run_number = workflow_run.get("run_number")
        run.event = workflow_run.get("event")
        run.status = workflow_run.get("status")
        run.conclusion = workflow_run.get("conclusion")
        run.workflow_name = workflow_run.get("name")
        run.head_branch = workflow_run.get("head_branch")
        run.head_sha = workflow_run.get("head_sha")
        run.url = workflow_run.get("html_url")
        run.raw_data = workflow_run

        if workflow_run.get("run_started_at"):
            run.started_at = self._parse_github_timestamp(
                workflow_run["run_started_at"]
            )
        if workflow_run.get("updated_at"):
            run.completed_at = self._parse_github_timestamp(workflow_run["updated_at"])

        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)

        return run

    async def _create_or_update_job(
        self, workflow_job: Dict, repository_id: int, installation_id: int
    ) -> Job:
        """Create or update job record"""
        job_id = str(workflow_job["id"])

        job = self.db.query(Job).filter(Job.job_id == job_id).first()

        if not job:
            job = Job(
                job_id=job_id,
                run_id=str(workflow_job.get("run_id")),
                run_attempt=workflow_job.get("run_attempt", 1),
                repository_id=repository_id,
                installation_id=installation_id,
            )

        job.job_name = workflow_job.get("name")
        job.status = workflow_job.get("status")
        job.conclusion = workflow_job.get("conclusion")
        job.url = workflow_job.get("html_url")
        job.raw_data = workflow_job

        if workflow_job.get("started_at"):
            job.started_at = self._parse_github_timestamp(workflow_job["started_at"])
        if workflow_job.get("completed_at"):
            job.completed_at = self._parse_github_timestamp(
                workflow_job["completed_at"]
            )

        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        return job

    async def _create_or_update_job_steps(self, steps_data: List[Dict], job_id: int):
        """Create or update job steps"""
        for step_data in steps_data:
            step = (
                self.db.query(JobStep)
                .filter(
                    JobStep.job_id == job_id,
                    JobStep.step_number == step_data.get("number", 0),
                )
                .first()
            )

            if not step:
                step = JobStep(
                    job_id=job_id,
                    step_number=step_data.get("number", 0),
                )

            step.name = step_data.get("name")
            step.status = step_data.get("status")
            step.conclusion = step_data.get("conclusion")

            if step_data.get("started_at"):
                step.started_at = self._parse_github_timestamp(step_data["started_at"])
            if step_data.get("completed_at"):
                step.completed_at = self._parse_github_timestamp(
                    step_data["completed_at"]
                )

            self.db.add(step)

        self.db.commit()

    async def _fetch_workflow_content_from_github(
        self, repo_full_name: str, workflow_path: str, installation_id: int
    ) -> Tuple[Optional[str], Optional[str]]:
        """Fetch workflow YAML content and description from GitHub"""
        try:
            token = await self.github_service.get_installation_token(installation_id)

            async with httpx.AsyncClient() as client:
                # Fetch file content
                url = f"{self.github_service.api_url}/repos/{repo_full_name}/contents/{workflow_path}"
                headers = {
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }

                response = await client.get(url, headers=headers)

                if response.status_code == 200:
                    content_data = response.json()

                    if content_data.get("encoding") == "base64":
                        # Decode base64 content
                        yaml_content = base64.b64decode(content_data["content"]).decode(
                            "utf-8"
                        )

                        # Extract description from YAML
                        description = self._extract_description_from_yaml(yaml_content)

                        return yaml_content, description

                else:
                    logger.warning(
                        f"Failed to fetch workflow content: {response.status_code} - {response.text}"
                    )
                    return None, None

        except Exception as e:
            logger.error(f"Error fetching workflow content from GitHub: {e}")
            return None, None

    async def _fetch_workflows_from_github(
        self, repo_full_name: str, installation_id: int
    ) -> List[Dict]:
        """Fetch all workflows for a repository from GitHub API"""
        try:
            token = await self.github_service.get_installation_token(installation_id)

            async with httpx.AsyncClient() as client:
                url = f"{self.github_service.api_url}/repos/{repo_full_name}/actions/workflows"
                headers = {
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }

                response = await client.get(url, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    return data.get("workflows", [])
                else:
                    logger.warning(
                        f"Failed to fetch workflows: {response.status_code} - {response.text}"
                    )
                    return []

        except Exception as e:
            logger.error(f"Error fetching workflows from GitHub: {e}")
            return []

    async def _sync_workflow_from_github_data(
        self, workflow_data: Dict, repository_id: int, installation_id: int
    ):
        """Create or update workflow from GitHub API data"""
        workflow = (
            self.db.query(Workflow)
            .filter(Workflow.workflow_id == str(workflow_data["id"]))
            .first()
        )

        if not workflow:
            workflow = Workflow(
                workflow_id=str(workflow_data["id"]),
                repository_id=repository_id,
                installation_id=installation_id,
            )

        workflow.name = workflow_data.get("name")
        workflow.path = workflow_data.get("path")
        workflow.state = workflow_data.get("state", "active")

        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)

        logger.debug(
            f"Skipping content fetch for workflow {workflow.name} (disabled to avoid permission issues)"
        )

    def _extract_description_from_yaml(self, yaml_content: str) -> Optional[str]:
        """Extract description/name from workflow YAML"""
        try:
            workflow_data = yaml.safe_load(yaml_content)
            return workflow_data.get("name") or workflow_data.get("description")
        except Exception as e:
            logger.debug(f"Could not parse YAML for description: {e}")
            return None

    def _generate_badge_url(self, repo_full_name: str, workflow_name: str) -> str:
        """Generate GitHub workflow status badge URL"""
        # URL encode the workflow name

        encoded_name = urllib.parse.quote(workflow_name)
        return f"https://github.com/{repo_full_name}/actions/workflows/{encoded_name}/badge.svg"

    def _parse_github_timestamp(self, timestamp_str: str) -> datetime:
        """Parse GitHub timestamp format"""
        try:
            # GitHub timestamps are in ISO format with Z suffix
            if timestamp_str.endswith("Z"):
                timestamp_str = timestamp_str[:-1] + "+00:00"
            return datetime.fromisoformat(timestamp_str)
        except Exception as e:
            logger.debug(f"Could not parse timestamp {timestamp_str}: {e}")
            return datetime.utcnow()

    async def fetch_and_store_job_logs(self, job_id: int, force_refresh: bool = False):
        """
        Fetch logs from GitHub API and store them in the database.

        Args:
            job_id (int): The database job ID (not GitHub job ID)
            force_refresh (bool): Whether to re-fetch logs even if they already exist
        """
        try:
            job = self.db.query(Job).filter(Job.id == job_id).first()
            if not job:
                logger.error(f"Job {job_id} not found in database")
                return

            repo = (
                self.db.query(Repository)
                .filter(Repository.id == job.repository_id)
                .first()
            )
            if not repo:
                logger.error(f"Repository for job {job_id} not found")
                return

            if not force_refresh:
                existing_logs = (
                    self.db.query(JobLog).filter(JobLog.job_id == job_id).first()
                )
                if existing_logs:
                    logger.debug(f"Logs already exist for job {job_id}, skipping fetch")
                    return

            logger.info(f"Fetching logs for job {job.job_id} from GitHub")

            raw_logs = await self.github_service.fetch_job_logs(
                repo.full_name, job.job_id, job.installation_id
            )

            if not raw_logs:
                logger.warning(f"No logs available for job {job.job_id}")
                return

            # Parse and store logs
            await self._parse_and_store_logs(job_id, raw_logs)
            logger.info(f"Successfully stored logs for job {job.job_id}")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error fetching and storing logs for job {job_id}: {e}")
            raise

    async def _parse_and_store_logs(self, job_id: int, raw_logs: str):
        """
        Parse raw log content and store individual lines in the database.
        Uses stateful parsing to properly associate logs with steps.

        Args:
            job_id (int): The database job ID
            raw_logs (str): Raw log content from GitHub
        """
        try:
            self.db.query(JobLog).filter(JobLog.job_id == job_id).delete()

            job_steps = (
                self.db.query(JobStep)
                .filter(JobStep.job_id == job_id)
                .order_by(JobStep.step_number)
                .all()
            )
            step_name_to_number = {
                step.name.lower(): step.step_number for step in job_steps if step.name
            }

            lines = raw_logs.splitlines()
            log_entries = []
            current_step_number = None

            for line_number, content in enumerate(lines, 1):
                if not content.strip():
                    continue

                timestamp = self._extract_timestamp_from_log_line(content)

                new_step_number = self._detect_step_transition(
                    content, step_name_to_number, job_steps
                )
                if new_step_number is not None:
                    current_step_number = new_step_number
                    logger.debug(
                        f"Line {line_number}: Detected step transition to step {current_step_number}"
                    )

                log_entry = JobLog(
                    job_id=job_id,
                    step_number=current_step_number,
                    line_number=line_number,
                    timestamp=timestamp,
                    content=content,
                )
                log_entries.append(log_entry)

            if log_entries:
                self.db.add_all(log_entries)
                self.db.commit()
                logger.info(f"Stored {len(log_entries)} log lines for job {job_id}")

                step_distribution = {}
                for entry in log_entries:
                    step_key = entry.step_number or "setup"
                    step_distribution[step_key] = step_distribution.get(step_key, 0) + 1
                logger.info(f"Step distribution: {step_distribution}")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error parsing and storing logs: {e}")
            raise

    def _extract_timestamp_from_log_line(self, log_line: str) -> datetime:
        """
        Extract timestamp from a log line, or use current time as fallback.

        Args:
            log_line (str): The log line content

        Returns:
            datetime: Extracted or fallback timestamp
        """

        timestamp_pattern = r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)"
        match = re.search(timestamp_pattern, log_line[:30])  # Check first 30 chars

        if match:
            try:
                timestamp_str = match.group(1)
                if timestamp_str.endswith("Z"):
                    timestamp_str = timestamp_str[:-1] + "+00:00"
                return datetime.fromisoformat(timestamp_str)
            except Exception:
                pass

        return datetime.utcnow()

    def _extract_step_number_from_log_line(self, log_line: str) -> Optional[int]:
        """
        Extract step number from log line if it's step-specific.

        Args:
            log_line (str): The log line content

        Returns:
            Optional[int]: Step number if found, None otherwise
        """
        import re

        step_patterns = [
            r"##\[group\]Run\s+.*",
            r"##\[section\]Starting:\s+(.+)",
            r"##\[section\]Finishing:\s+(.+)",
            r"##\[group\]Step\s+(\d+):\s+(.+)",
            r"Step\s+(\d+)\s*[:/]",
            r"##\[group\](.+)",
        ]

        for pattern in step_patterns:
            match = re.search(pattern, log_line, re.IGNORECASE)
            if match:
                if r"(\d+)" in pattern and match.groups():
                    try:
                        return int(match.group(1))
                    except (ValueError, IndexError):
                        continue

                break

        return None

    def _detect_step_transition(
        self, log_line: str, step_name_to_number: dict, job_steps: list
    ) -> Optional[int]:
        """
        Detect if a log line indicates we're transitioning to a new step.

        Args:
            log_line (str): The log line content
            step_name_to_number (dict): Mapping of step names to numbers
            job_steps (list): List of JobStep objects

        Returns:
            Optional[int]: Step number if transition detected, None otherwise
        """
        import re

        transition_patterns = [
            r"##\[group\]Run\s+(.+)",
            r"##\[group\]Post Run\s+(.+)",
            r"##\[section\]Starting:\s*(.+)",
            r"##\[group\]([^R][^u][^n].*)",
            r"##\[group\](.+)",
        ]

        for pattern in transition_patterns:
            match = re.search(pattern, log_line.strip())
            if match:
                step_identifier = match.group(1).strip().lower()

                if step_identifier.startswith("actions/"):
                    continue

                if step_identifier in step_name_to_number:
                    return step_name_to_number[step_identifier]

                for step_name, step_number in step_name_to_number.items():
                    if step_name in step_identifier or step_identifier in step_name:
                        return step_number

                for step in job_steps:
                    if step.name:
                        step_name_clean = step.name.lower()
                        if any(
                            keyword in step_identifier
                            for keyword in step_name_clean.split()
                        ):
                            return step.step_number

                logger.debug(
                    f"Detected step transition marker but couldn't map: '{step_identifier}'"
                )
                break

        return None
