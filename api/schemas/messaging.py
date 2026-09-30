from pydantic import BaseModel
from datetime import datetime
from api.schemas.forum import PostAuthor


class MessageRead(BaseModel):
    id: int
    conversation_id: int
    author: PostAuthor
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    id: int
    title: str | None
    is_group: bool
    other_members: list[PostAuthor] = []
    last_message: MessageRead | None = None
    unread: bool = False
    last_message_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(BaseModel):
    id: int
    title: str | None
    is_group: bool
    members: list[PostAuthor] = []
    messages: list[MessageRead] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    member_ids: list[int]
    title: str | None = None
    body: str


class MessageCreate(BaseModel):
    body: str
