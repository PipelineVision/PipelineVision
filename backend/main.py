import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.utils.logger import setup_logger
from app.db.session import engine, Base
from app.api.router import api_router
from app.core.config import settings

# from app.core.scheduler import runner_scheduler
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.auth import BetterAuthMiddleware

load_dotenv()

setup_logger()

Base.metadata.create_all(bind=engine)

origins = os.getenv("BACKEND_CORS_ORIGINS", "").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    # await runner_scheduler.start()
    yield
    # Shutdown
    # await runner_scheduler.stop()


app = FastAPI(
    title="GitHub Runner Dashboard",
    description="Monitor and manage your GitHub runners",
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(BetterAuthMiddleware)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Pipeline Vision"}
