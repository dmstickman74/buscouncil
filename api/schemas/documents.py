from pydantic import BaseModel
from datetime import datetime


class DocumentRead(BaseModel):
    id: int
    council_id: int
    uploaded_by: int
    uploader_name: str = ""
    filename: str
    display_name: str
    description: str | None
    mime_type: str
    file_size: int
    category: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentUpdate(BaseModel):
    display_name: str | None = None
    description: str | None = None
    category: str | None = None
