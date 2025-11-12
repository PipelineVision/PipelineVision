from pydantic import BaseModel

from typing import Optional


class User(BaseModel):
    id: str
    email: str
    name: str
    token: str
    organization_id: str


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    website: Optional[str] = None
    created_at: str
    updated_at: str


class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    website: Optional[str] = None
