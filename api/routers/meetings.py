from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from api.auth import current_user, require_council_access, is_admin
from api.database import get_db
from api.audit import log_activity
from api.models.auth import User
from api.models.meetings import Meeting
from api.schemas.meetings import MeetingRead, MeetingCreate, MeetingUpdate

router = APIRouter(prefix="/councils/{council_id}/meetings", tags=["meetings"])


@router.get("", response_model=list[MeetingRead])
def list_meetings(
    council_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    meetings = (
        db.query(Meeting)
        .filter(Meeting.council_id == council_id)
        .order_by(Meeting.meeting_date.desc())
        .all()
    )

    return [
        MeetingRead(
            id=m.id, council_id=m.council_id, title=m.title,
            description=m.description, meeting_date=m.meeting_date,
            location=m.location, meeting_link=m.meeting_link,
            created_by=m.created_by,
            creator_name=m.creator.display_name if m.creator else "",
            created_at=m.created_at,
        )
        for m in meetings
    ]


@router.post("", response_model=MeetingRead, status_code=201)
def create_meeting(
    council_id: int,
    body: MeetingCreate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    meeting = Meeting(
        council_id=council_id,
        title=body.title,
        description=body.description,
        meeting_date=body.meeting_date,
        location=body.location,
        meeting_link=body.meeting_link,
        created_by=user.id,
    )
    db.add(meeting)
    log_activity(db, user.id, "create_meeting", "meeting", None, {"title": body.title})
    db.commit()
    db.refresh(meeting)

    return MeetingRead(
        id=meeting.id, council_id=meeting.council_id, title=meeting.title,
        description=meeting.description, meeting_date=meeting.meeting_date,
        location=meeting.location, meeting_link=meeting.meeting_link,
        created_by=meeting.created_by, creator_name=user.display_name,
        created_at=meeting.created_at,
    )


@router.put("/{meeting_id}", response_model=MeetingRead)
def update_meeting(
    council_id: int,
    meeting_id: int,
    body: MeetingUpdate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.council_id == council_id).first()
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    if body.title is not None:
        meeting.title = body.title
    if body.description is not None:
        meeting.description = body.description
    if body.meeting_date is not None:
        meeting.meeting_date = body.meeting_date
    if body.location is not None:
        meeting.location = body.location
    if body.meeting_link is not None:
        meeting.meeting_link = body.meeting_link

    log_activity(db, user.id, "update_meeting", "meeting", meeting_id)
    db.commit()
    db.refresh(meeting)

    return MeetingRead(
        id=meeting.id, council_id=meeting.council_id, title=meeting.title,
        description=meeting.description, meeting_date=meeting.meeting_date,
        location=meeting.location, meeting_link=meeting.meeting_link,
        created_by=meeting.created_by,
        creator_name=meeting.creator.display_name if meeting.creator else "",
        created_at=meeting.created_at,
    )


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(
    council_id: int,
    meeting_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    if not is_admin(user, db):
        raise HTTPException(403, "Only admins can delete meetings")

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.council_id == council_id).first()
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    db.delete(meeting)
    log_activity(db, user.id, "delete_meeting", "meeting", meeting_id)
    db.commit()
