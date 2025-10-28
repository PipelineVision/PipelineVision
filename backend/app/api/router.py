from fastapi import APIRouter

from app.api.endpoints import (
    webhooks,
    accounts,
    orgs,
    dashboard,
    workflow_runs,
    workflows,
    sse,
    logs,
    jobs,
    organization,
    users,
)

api_router = APIRouter()

api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(orgs.router, prefix="/orgs", tags=["orgs"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(
    workflow_runs.router, prefix="/workflow-runs", tags=["workflow-runs"]
)
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(organization.router, prefix="/organization", tags=["organization"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(sse.router, tags=["sse"])
