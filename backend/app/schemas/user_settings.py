from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PollingSettings(BaseModel):
    active_runs: int = Field(
        default=10,
        ge=5,
        le=60,
        description="Seconds between polls for active workflows",
    )
    recent_runs: int = Field(
        default=30,
        ge=10,
        le=300,
        description="Seconds between polls for recent workflows",
    )
    older_runs: int = Field(
        default=300,
        ge=60,
        le=3600,
        description="Seconds between polls for older workflows",
    )
    background: int = Field(
        default=120,
        ge=30,
        le=600,
        description="Seconds between polls when tab not visible",
    )
    enable_background_polling: bool = Field(
        default=True, description="Enable polling when tab not visible"
    )


class NotificationSettings(BaseModel):
    email_on_failure: bool = Field(
        default=False, description="Send email when workflows fail"
    )
    email_on_success: bool = Field(
        default=False, description="Send email when workflows succeed"
    )
    browser_notifications: bool = Field(
        default=False, description="Enable browser notifications"
    )
    workflow_completion: bool = Field(
        default=False, description="Notify on workflow completion"
    )


class DisplaySettings(BaseModel):
    theme: str = Field(
        default="system",
        pattern="^(light|dark|system)$",
        description="UI theme preference",
    )
    items_per_page: int = Field(
        default=25, ge=10, le=100, description="Number of items to show per page"
    )
    show_runner_details: bool = Field(
        default=True, description="Show detailed runner information"
    )
    compact_view: bool = Field(default=False, description="Use compact view for lists")


class UserSettingsBase(BaseModel):
    organization_id: str
    polling_settings: Optional[PollingSettings] = None
    notification_settings: Optional[NotificationSettings] = None
    display_settings: Optional[DisplaySettings] = None


class UserSettingsCreate(UserSettingsBase):
    pass


class UserSettingsUpdate(BaseModel):
    organization_id: Optional[str] = None
    polling_settings: Optional[PollingSettings] = None
    notification_settings: Optional[NotificationSettings] = None
    display_settings: Optional[DisplaySettings] = None


class UserSettings(UserSettingsBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[^@]+@[^@]+\.[^@]+$")
    image: Optional[str] = Field(None, max_length=500)
