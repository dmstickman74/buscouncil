from pydantic import BaseModel
from datetime import datetime


class MeetingRead(BaseModel):
    id: int
    council_id: int
    title: str
    description: str | None
    meeting_date: datetime
    location: str | None
    meeting_link: str | None
    created_by: int
    creator_name: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingCreate(BaseModel):
    title: str
    description: str | None = None
    meeting_date: datetime
    location: str | None = None
    meeting_link: str | None = None


class MeetingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    meeting_date: datetime | None = None
    location: str | None = None
    meeting_link: str | None = None
