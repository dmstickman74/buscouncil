from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession, joinedload

from api.auth import current_user
from api.database import get_db
from api.audit import log_activity
from api.models.auth import User
from api.models.messaging import Conversation, ConversationMember, Message
from api.schemas.forum import PostAuthor
from api.schemas.messaging import (
    ConversationCreate, ConversationDetail, ConversationSummary,
    MessageCreate, MessageRead,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationSummary])
def list_conversations(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    memberships = (
        db.query(ConversationMember)
        .filter(ConversationMember.user_id == user.id)
        .all()
    )
    conv_ids = [m.conversation_id for m in memberships]
    if not conv_ids:
        return []

    last_read_map = {m.conversation_id: m.last_read_at for m in memberships}

    convos = (
        db.query(Conversation)
        .filter(Conversation.id.in_(conv_ids))
        .options(joinedload(Conversation.members).joinedload(ConversationMember.user))
        .order_by(Conversation.last_message_at.desc().nullslast())
        .all()
    )

    result = []
    for c in convos:
        others = [
            PostAuthor.model_validate(m.user)
            for m in c.members
            if m.user_id != user.id
        ]

        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == c.id)
            .order_by(Message.created_at.desc())
            .first()
        )

        last_read = last_read_map.get(c.id)
        unread = False
        if last_msg and (not last_read or last_msg.created_at > last_read):
            unread = True

        result.append(ConversationSummary(
            id=c.id,
            title=c.title,
            is_group=c.is_group,
            other_members=others,
            last_message=MessageRead(
                id=last_msg.id, conversation_id=last_msg.conversation_id,
                author=PostAuthor.model_validate(last_msg.author),
                body=last_msg.body, created_at=last_msg.created_at,
            ) if last_msg else None,
            unread=unread,
            last_message_at=c.last_message_at,
            created_at=c.created_at,
        ))

    return result


@router.post("", response_model=ConversationDetail, status_code=201)
def create_conversation(
    body: ConversationCreate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    is_group = len(body.member_ids) > 1

    if not is_group and len(body.member_ids) == 1:
        other_id = body.member_ids[0]
        existing = (
            db.query(Conversation)
            .join(ConversationMember)
            .filter(
                Conversation.is_group == False,
                ConversationMember.user_id == user.id,
            )
            .all()
        )
        for conv in existing:
            member_ids = {m.user_id for m in conv.members}
            if member_ids == {user.id, other_id}:
                msg = Message(conversation_id=conv.id, author_id=user.id, body=body.body)
                db.add(msg)
                conv.last_message_at = datetime.now(timezone.utc)
                db.commit()
                return _conversation_detail(conv, db)

    conv = Conversation(
        title=body.title if is_group else None,
        is_group=is_group,
        created_by=user.id,
        last_message_at=datetime.now(timezone.utc),
    )
    db.add(conv)
    db.flush()

    all_member_ids = set(body.member_ids) | {user.id}
    for mid in all_member_ids:
        db.add(ConversationMember(conversation_id=conv.id, user_id=mid))

    msg = Message(conversation_id=conv.id, author_id=user.id, body=body.body)
    db.add(msg)

    log_activity(db, user.id, "create_conversation", "conversation", conv.id)
    db.commit()
    db.refresh(conv)

    return _conversation_detail(conv, db)


@router.get("/{conv_id}", response_model=ConversationDetail)
def get_conversation(
    conv_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == user.id,
    ).first()
    if not membership:
        raise HTTPException(403, "Not a member of this conversation")

    conv = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.members).joinedload(ConversationMember.user),
            joinedload(Conversation.messages).joinedload(Message.author),
        )
        .filter(Conversation.id == conv_id)
        .first()
    )
    if not conv:
        raise HTTPException(404, "Conversation not found")

    membership.last_read_at = datetime.now(timezone.utc)
    db.commit()

    return _conversation_detail(conv, db)


@router.post("/{conv_id}/messages", response_model=MessageRead, status_code=201)
def send_message(
    conv_id: int,
    body: MessageCreate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == user.id,
    ).first()
    if not membership:
        raise HTTPException(403, "Not a member of this conversation")

    msg = Message(conversation_id=conv_id, author_id=user.id, body=body.body)
    db.add(msg)

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    conv.last_message_at = datetime.now(timezone.utc)

    membership.last_read_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(msg)

    return MessageRead(
        id=msg.id, conversation_id=msg.conversation_id,
        author=PostAuthor.model_validate(user),
        body=msg.body, created_at=msg.created_at,
    )


@router.post("/{conv_id}/read")
def mark_read(
    conv_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == user.id,
    ).first()
    if not membership:
        raise HTTPException(403, "Not a member of this conversation")

    membership.last_read_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


def _conversation_detail(conv: Conversation, db: DBSession) -> ConversationDetail:
    if not conv.members:
        conv = (
            db.query(Conversation)
            .options(
                joinedload(Conversation.members).joinedload(ConversationMember.user),
                joinedload(Conversation.messages).joinedload(Message.author),
            )
            .filter(Conversation.id == conv.id)
            .first()
        )

    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        is_group=conv.is_group,
        members=[PostAuthor.model_validate(m.user) for m in conv.members],
        messages=[
            MessageRead(
                id=m.id, conversation_id=m.conversation_id,
                author=PostAuthor.model_validate(m.author),
                body=m.body, created_at=m.created_at,
            )
            for m in conv.messages
        ],
        created_at=conv.created_at,
    )
