import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session as DBSession

from api.auth import current_user, require_council_access, is_admin
from api.config import UPLOAD_DIR
from api.database import get_db
from api.audit import log_activity
from api.models.auth import User
from api.models.documents import Document
from api.schemas.documents import DocumentRead, DocumentUpdate

router = APIRouter(prefix="/councils/{council_id}/documents", tags=["documents"])


@router.get("", response_model=list[DocumentRead])
def list_documents(
    council_id: int,
    category: str | None = None,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    query = db.query(Document).filter(Document.council_id == council_id)
    if category:
        query = query.filter(Document.category == category)

    docs = query.order_by(Document.created_at.desc()).all()

    return [
        DocumentRead(
            id=d.id, council_id=d.council_id, uploaded_by=d.uploaded_by,
            uploader_name=d.uploader.display_name if d.uploader else "",
            filename=d.filename, display_name=d.display_name,
            description=d.description, mime_type=d.mime_type,
            file_size=d.file_size, category=d.category, created_at=d.created_at,
        )
        for d in docs
    ]


@router.post("", response_model=DocumentRead, status_code=201)
async def upload_document(
    council_id: int,
    file: UploadFile = File(...),
    display_name: str = Form(""),
    description: str = Form(""),
    category: str = Form("general"),
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    council_dir = os.path.join(UPLOAD_DIR, str(council_id))
    os.makedirs(council_dir, exist_ok=True)

    file_uuid = uuid.uuid4().hex
    safe_filename = f"{file_uuid}_{file.filename}"
    storage_path = os.path.join(str(council_id), safe_filename)
    full_path = os.path.join(UPLOAD_DIR, storage_path)

    content = await file.read()
    with open(full_path, "wb") as f:
        f.write(content)

    doc = Document(
        council_id=council_id,
        uploaded_by=user.id,
        filename=file.filename,
        display_name=display_name or file.filename,
        description=description or None,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        storage_path=storage_path,
        category=category,
    )
    db.add(doc)
    log_activity(db, user.id, "upload_document", "document", None, {"filename": file.filename})
    db.commit()
    db.refresh(doc)

    return DocumentRead(
        id=doc.id, council_id=doc.council_id, uploaded_by=doc.uploaded_by,
        uploader_name=user.display_name, filename=doc.filename,
        display_name=doc.display_name, description=doc.description,
        mime_type=doc.mime_type, file_size=doc.file_size,
        category=doc.category, created_at=doc.created_at,
    )


@router.get("/{doc_id}/download")
def download_document(
    council_id: int,
    doc_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    doc = db.query(Document).filter(Document.id == doc_id, Document.council_id == council_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    full_path = os.path.join(UPLOAD_DIR, doc.storage_path)
    if not os.path.exists(full_path):
        raise HTTPException(404, "File not found on disk")

    return FileResponse(full_path, media_type=doc.mime_type, filename=doc.filename)


@router.put("/{doc_id}", response_model=DocumentRead)
def update_document(
    council_id: int,
    doc_id: int,
    body: DocumentUpdate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    doc = db.query(Document).filter(Document.id == doc_id, Document.council_id == council_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if doc.uploaded_by != user.id and not is_admin(user, db):
        raise HTTPException(403, "Only the uploader or an admin can edit this document")

    if body.display_name is not None:
        doc.display_name = body.display_name
    if body.description is not None:
        doc.description = body.description
    if body.category is not None:
        doc.category = body.category

    db.commit()
    db.refresh(doc)

    return DocumentRead(
        id=doc.id, council_id=doc.council_id, uploaded_by=doc.uploaded_by,
        uploader_name=doc.uploader.display_name if doc.uploader else "",
        filename=doc.filename, display_name=doc.display_name,
        description=doc.description, mime_type=doc.mime_type,
        file_size=doc.file_size, category=doc.category, created_at=doc.created_at,
    )


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    council_id: int,
    doc_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    doc = db.query(Document).filter(Document.id == doc_id, Document.council_id == council_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if doc.uploaded_by != user.id and not is_admin(user, db):
        raise HTTPException(403, "Only the uploader or an admin can delete this document")

    full_path = os.path.join(UPLOAD_DIR, doc.storage_path)
    if os.path.exists(full_path):
        os.remove(full_path)

    db.delete(doc)
    log_activity(db, user.id, "delete_document", "document", doc_id)
    db.commit()
