from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
import datetime

from app.db.session import Base


class Runner(Base):
    """
    Represents a GitHub Actions runner.

    Attributes:
        id (int): The unique identifier for the runner in the database.
        installation_id (int): The ID of the GitHub App installation associated with the runner.
        runner_id (str): The unique GitHub runner ID.
        name (str): The name of the runner.
        os (str): The operating system of the runner (nullable).
        busy (bool): Whether the runner is currently busy (nullable).
        ephemeral (bool): Whether the runner is ephemeral (nullable).
        status (str): The current status of the runner (e.g., "online", "offline").
        labels (JSON): The labels associated with the runner (nullable).
        architecture (str): The architecture of the runner (nullable).
        last_seen (datetime): The timestamp when the runner was last seen.
        created_at (datetime): The timestamp when the runner record was created.
        updated_at (datetime): The timestamp when the runner record was last updated.
        last_check (datetime): The timestamp when the runner was last checked.

    Relationships:
        jobs (list[Job]): The jobs assigned to the runner.
        installation (Installation): The GitHub App installation associated with the runner.
    """

    __tablename__ = "runners"

    id = Column(Integer, primary_key=True, index=True)
    installation_id = Column(
        Integer, ForeignKey("installations.installation_id", ondelete="CASCADE")
    )
    runner_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    os = Column(String, nullable=True)
    busy = Column(Boolean, nullable=False, default=False)
    ephemeral = Column(Boolean, nullable=True)
    status = Column(String)
    labels = Column(JSON, nullable=True)
    architecture = Column(
        String, nullable=True
    )  # TODO: Decide if we still need this or not
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )
    last_check = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    jobs = relationship("Job", back_populates="runner")
    installation = relationship("Installation", back_populates="runners")
