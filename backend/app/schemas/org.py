from datetime import datetime

from pydantic import BaseModel, HttpUrl, field_validator


class OrganizationMembershipSchema(BaseModel):
    id: str
    login: str

    model_config = {"from_attributes": True}


class MembershipRequest(BaseModel):
    membership_id: str


class Runners(BaseModel):
    id: int
    installation_id: int
    runner_id: int
    name: str
    os: str | None
    busy: bool
    ephemeral: bool | None
    status: str
    labels: list
    architecture: str | None
    last_seen: datetime
    created_at: datetime
    updated_at: datetime
    last_check: datetime

    @field_validator("busy", mode="before")
    @classmethod
    def validate_busy(cls, v):
        if v is None:
            return False
        return v

    model_config = {"from_attributes": True}


class OrganizationMember(BaseModel):
    login: str
    id: int
    node_id: str
    avatar_url: HttpUrl
    gravatar_id: str
    url: HttpUrl
    html_url: HttpUrl
    followers_url: HttpUrl
    following_url: str
    gists_url: str
    starred_url: str
    subscriptions_url: HttpUrl
    organizations_url: HttpUrl
    repos_url: HttpUrl
    events_url: str
    received_events_url: HttpUrl
    type: str
    user_view_type: str
    site_admin: bool


class OrganizationMembersResponse(BaseModel):
    members: list[OrganizationMember]
