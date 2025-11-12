from sqlalchemy import Column, String, ForeignKey, Integer, JSON, DateTime
import datetime

from sqlalchemy.orm import relationship

from app.db.session import Base


# TODO: Implement logic for polling, notification, and display settings
class UserPreference(Base):
    """
    Represents a user's preferences and settings.

    Attributes:
        id (int): The unique identifier for the user preference record in the database.
        user_id (str): The ID of the user associated with the preference.
        organization_id (str): The ID of the organization associated with the preference.
        polling_settings (JSON): Polling interval preferences for different data types.
        notification_settings (JSON): Notification preferences and settings.
        display_settings (JSON): UI display preferences and customizations.
        created_at (datetime): The timestamp when the preference was created.
        updated_at (datetime): The timestamp when the preference was last updated.

    Relationships:
        user (AuthUser): The user associated with the preference.
    """

    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        String, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False
    )
    organization_id = Column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    polling_settings = Column(
        JSON,
        nullable=True,
        default=lambda: {
            "active_runs": 10,
            "recent_runs": 30,
            "older_runs": 300,
            "background": 120,
            "enable_background_polling": True,
        },
    )

    notification_settings = Column(
        JSON,
        nullable=True,
        default=lambda: {
            "email_on_failure": False,
            "email_on_success": False,
            "browser_notifications": False,
            "workflow_completion": False,
        },
    )

    display_settings = Column(
        JSON,
        nullable=True,
        default=lambda: {
            "theme": "system",
            "items_per_page": 25,
            "show_runner_details": True,
            "compact_view": False,
        },
    )

    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    user = relationship("AuthUser", back_populates="preferences")
