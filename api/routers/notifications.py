from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession

from api.auth import current_user
from api.database import get_db
from api.models.auth import User
from api.models.notifications import Notification, NotificationPreference
from api.schemas.notifications import (
    NotificationRead, NotificationPreferenceRead, NotificationPreferenceUpdate,
    MarkReadRequest, NotificationsResponse,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationsResponse)
def list_notifications(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    base = db.query(Notification).filter(Notification.user_id == user.id)
    total = base.count()
    unread_count = base.filter(Notification.read == False).count()

    items = (
        base
        .order_by(Notification.read, Notification.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return NotificationsResponse(
        notifications=[NotificationRead.model_validate(n) for n in items],
        total=total,
        unread_count=unread_count,
    )


@router.post("/read")
def mark_read(
    body: MarkReadRequest,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.id.in_(body.notification_ids),
        Notification.user_id == user.id,
    ).update({"read": True}, synchronize_session=False)
    db.commit()
    return {"ok": True}


@router.get("/preferences", response_model=NotificationPreferenceRead)
def get_preferences(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return NotificationPreferenceRead.model_validate(pref)


@router.put("/preferences", response_model=NotificationPreferenceRead)
def update_preferences(
    body: NotificationPreferenceUpdate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=user.id)
        db.add(pref)
        db.flush()

    if body.forum_frequency is not None:
        pref.forum_frequency = body.forum_frequency
    if body.dm_frequency is not None:
        pref.dm_frequency = body.dm_frequency
    if body.mention_frequency is not None:
        pref.mention_frequency = body.mention_frequency

    db.commit()
    db.refresh(pref)

    return NotificationPreferenceRead.model_validate(pref)
