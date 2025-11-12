from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import relationship
import datetime

from app.db.session import Base


class Installation(Base):
    """
    Represents a GitHub App installation.

    Attributes:
        id (int): The unique identifier for the installation record in the database.
        installation_id (int): The unique GitHub installation ID for the app.
        organization_id (str): The ID of the organization associated with the installation.
        installer_github_id (int): The GitHub ID of the user who installed the app (optional).
        app_id (int): The ID of the GitHub App associated with the installation.
        installed_at (str): The timestamp (as a string) when the app was installed.
        active (bool): Whether the installation is currently active.
        created_at (datetime): The timestamp when the installation record was created.
        updated_at (datetime): The timestamp when the installation record was last updated.

    Relationships:
        organization (Organization): The organization associated with the installation.
        repositories (list[Repository]): The repositories associated with the installation.
        runners (list[Runner]): The runners associated with the installation.
        jobs (list[Job]): The jobs associated with the installation.
    """

    __tablename__ = "installations"

    id = Column(Integer, primary_key=True, index=True)
    installation_id = Column(Integer, unique=True, index=True)
    organization_id = Column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    installer_github_id = Column(Integer, nullable=True)
    app_id = Column(Integer)
    installed_at = Column(String)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    organization = relationship("Organization", back_populates="installations")
    repositories = relationship(
        "Repository", back_populates="installation", cascade="all, delete-orphan"
    )
    runners = relationship(
        "Runner", back_populates="installation", cascade="all, delete-orphan"
    )
    jobs = relationship(
        "Job", back_populates="installation", cascade="all, delete-orphan"
    )
    workflows = relationship(
        "Workflow", back_populates="installation", cascade="all, delete-orphan"
    )
    workflow_runs = relationship(
        "WorkflowRun", back_populates="installation", cascade="all, delete-orphan"
    )
