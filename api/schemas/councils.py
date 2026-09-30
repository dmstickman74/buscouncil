from pydantic import BaseModel
from datetime import datetime


class CouncilRead(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    active: bool
    member_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class CouncilCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None


class CouncilUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    active: bool | None = None


class CouncilMemberRead(BaseModel):
    id: int
    user_id: int
    display_name: str
    email: str
    title: str | None
    company: str | None
    photo_url: str | None
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: int
    role: str = "firm_member"
