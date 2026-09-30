from pydantic import BaseModel
from datetime import datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class UserRead(BaseModel):
    id: int
    email: str
    display_name: str
    bio: str | None
    title: str | None
    company: str | None
    phone: str | None
    photo_url: str | None
    active: bool
    last_login_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: str
    display_name: str
    password: str
    title: str | None = None
    company: str | None = None
    role_key: str = "member"


class UserUpdate(BaseModel):
    display_name: str | None = None
    active: bool | None = None


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    title: str | None = None
    company: str | None = None
    phone: str | None = None


class RoleRead(BaseModel):
    id: int
    key: str
    label: str

    model_config = {"from_attributes": True}


class WhoAmI(BaseModel):
    user: UserRead
    roles: list[str]
    permissions: dict[str, str]
    council_id: int | None
    council_slug: str | None
    council_role: str | None
    unread_notifications: int
