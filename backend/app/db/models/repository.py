from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime

from app.db.session import Base


class Repository(Base):
    """
    Represents a GitHub repository.

    Attributes:
        id (int): The unique identifier for the repository in the database.
        github_id (int): The unique GitHub ID for the repository.
        name (str): The name of the repository.
        full_name (str): The full name of the repository (e.g., "owner/repo").
        owner (str): The owner of the repository.
        installation_id (int): The ID of the GitHub App installation associated with the repository.
        created_at (datetime): The timestamp when the repository record was created.
        updated_at (datetime): The timestamp when the repository record was last updated.

    Relationships:
        jobs (list[Job]): The jobs associated with the repository.
        installation (Installation): The GitHub App installation associated with the repository.
    """

    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, index=True)
    name = Column(String)
    full_name = Column(String)
    owner = Column(String)
    installation_id = Column(
        Integer, ForeignKey("installations.installation_id", ondelete="CASCADE")
    )
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    jobs = relationship("Job", back_populates="repository")
    installation = relationship("Installation", back_populates="repositories")
    workflows = relationship("Workflow", back_populates="repository")
    workflow_runs = relationship("WorkflowRun", back_populates="repository")
