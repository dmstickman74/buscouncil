from pydantic import BaseModel
from datetime import datetime


class TagRead(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}


class PostAuthor(BaseModel):
    id: int
    display_name: str
    title: str | None
    company: str | None
    photo_url: str | None

    model_config = {"from_attributes": True}


class PostRead(BaseModel):
    id: int
    thread_id: int
    author: PostAuthor
    body: str
    position: int
    edited_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ThreadSummary(BaseModel):
    id: int
    title: str
    author: PostAuthor
    pinned: bool
    locked: bool
    reply_count: int
    tags: list[TagRead] = []
    last_activity_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class ThreadDetail(BaseModel):
    id: int
    council_id: int
    title: str
    author: PostAuthor
    pinned: bool
    locked: bool
    reply_count: int
    tags: list[TagRead] = []
    posts: list[PostRead] = []
    is_subscribed: bool = False
    is_muted: bool = False
    last_activity_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class ThreadCreate(BaseModel):
    title: str
    body: str
    tag_ids: list[int] = []


class PostCreate(BaseModel):
    body: str


class PostUpdate(BaseModel):
    body: str


class ThreadUpdate(BaseModel):
    title: str | None = None
    pinned: bool | None = None
    locked: bool | None = None


class SubscribeRequest(BaseModel):
    muted: bool = False


class ThreadsResponse(BaseModel):
    threads: list[ThreadSummary]
    total: int
    page: int
    per_page: int
