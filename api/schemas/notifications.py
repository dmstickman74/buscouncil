from pydantic import BaseModel
from datetime import datetime


class NotificationRead(BaseModel):
    id: int
    type: str
    title: str
    body: str | None
    link: str
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationPreferenceRead(BaseModel):
    forum_frequency: str
    dm_frequency: str
    mention_frequency: str

    model_config = {"from_attributes": True}


class NotificationPreferenceUpdate(BaseModel):
    forum_frequency: str | None = None
    dm_frequency: str | None = None
    mention_frequency: str | None = None


class MarkReadRequest(BaseModel):
    notification_ids: list[int]


class NotificationsResponse(BaseModel):
    notifications: list[NotificationRead]
    total: int
    unread_count: int
