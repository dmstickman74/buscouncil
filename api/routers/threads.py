from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession, joinedload

from api.auth import current_user, require_council_access, is_admin
from api.database import get_db
from api.audit import log_activity
from api.models.auth import User
from api.models.forum import Thread, Post, Tag, ThreadTag, ThreadSubscription
from api.schemas.forum import (
    ThreadCreate, ThreadDetail, ThreadSummary, ThreadUpdate, ThreadsResponse,
    PostCreate, PostRead, PostUpdate, PostAuthor, TagRead,
    SubscribeRequest,
)

router = APIRouter(prefix="/councils/{council_id}/threads", tags=["threads"])


@router.get("", response_model=ThreadsResponse)
def list_threads(
    council_id: int,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
    tag_id: int | None = None,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    query = db.query(Thread).filter(Thread.council_id == council_id)

    if tag_id:
        query = query.join(ThreadTag).filter(ThreadTag.tag_id == tag_id)

    total = query.count()

    threads = (
        query
        .options(joinedload(Thread.author), joinedload(Thread.tags))
        .order_by(Thread.pinned.desc(), Thread.last_activity_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    items = []
    for t in threads:
        items.append(ThreadSummary(
            id=t.id,
            title=t.title,
            author=PostAuthor.model_validate(t.author),
            pinned=t.pinned,
            locked=t.locked,
            reply_count=t.reply_count,
            tags=[TagRead.model_validate(tag) for tag in t.tags],
            last_activity_at=t.last_activity_at,
            created_at=t.created_at,
        ))

    return ThreadsResponse(threads=items, total=total, page=page, per_page=per_page)


@router.post("", response_model=ThreadDetail, status_code=201)
def create_thread(
    council_id: int,
    body: ThreadCreate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    thread = Thread(
        council_id=council_id,
        author_id=user.id,
        title=body.title,
    )
    db.add(thread)
    db.flush()

    post = Post(
        thread_id=thread.id,
        author_id=user.id,
        body=body.body,
        position=0,
    )
    db.add(post)

    if body.tag_ids:
        for tag_id in body.tag_ids:
            tag = db.query(Tag).filter(Tag.id == tag_id, Tag.council_id == council_id).first()
            if tag:
                db.add(ThreadTag(thread_id=thread.id, tag_id=tag.id))

    db.add(ThreadSubscription(thread_id=thread.id, user_id=user.id))

    log_activity(db, user.id, "create_thread", "thread", thread.id, {"title": body.title})
    db.commit()
    db.refresh(thread)

    return _thread_detail(thread, user, db)


@router.get("/{thread_id}", response_model=ThreadDetail)
def get_thread(
    council_id: int,
    thread_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    thread = (
        db.query(Thread)
        .options(
            joinedload(Thread.author),
            joinedload(Thread.tags),
            joinedload(Thread.posts).joinedload(Post.author),
        )
        .filter(Thread.id == thread_id, Thread.council_id == council_id)
        .first()
    )
    if not thread:
        raise HTTPException(404, "Thread not found")

    return _thread_detail(thread, user, db)


@router.put("/{thread_id}", response_model=ThreadDetail)
def update_thread(
    council_id: int,
    thread_id: int,
    body: ThreadUpdate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    thread = db.query(Thread).filter(Thread.id == thread_id, Thread.council_id == council_id).first()
    if not thread:
        raise HTTPException(404, "Thread not found")

    if thread.author_id != user.id and not is_admin(user, db):
        raise HTTPException(403, "Only the author or an admin can edit this thread")

    if body.title is not None:
        thread.title = body.title
    if body.pinned is not None:
        thread.pinned = body.pinned
    if body.locked is not None:
        thread.locked = body.locked

    log_activity(db, user.id, "update_thread", "thread", thread.id)
    db.commit()
    db.refresh(thread)

    return _thread_detail(thread, user, db)


@router.delete("/{thread_id}", status_code=204)
def delete_thread(
    council_id: int,
    thread_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    if not is_admin(user, db):
        raise HTTPException(403, "Only admins can delete threads")

    thread = db.query(Thread).filter(Thread.id == thread_id, Thread.council_id == council_id).first()
    if not thread:
        raise HTTPException(404, "Thread not found")

    db.delete(thread)
    log_activity(db, user.id, "delete_thread", "thread", thread_id)
    db.commit()


@router.post("/{thread_id}/posts", response_model=PostRead, status_code=201)
def create_post(
    council_id: int,
    thread_id: int,
    body: PostCreate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    thread = db.query(Thread).filter(Thread.id == thread_id, Thread.council_id == council_id).first()
    if not thread:
        raise HTTPException(404, "Thread not found")
    if thread.locked:
        raise HTTPException(403, "Thread is locked")

    max_pos = db.query(Post.position).filter(Post.thread_id == thread_id).order_by(Post.position.desc()).first()
    position = (max_pos[0] + 1) if max_pos else 0

    post = Post(
        thread_id=thread_id,
        author_id=user.id,
        body=body.body,
        position=position,
    )
    db.add(post)

    thread.reply_count = position
    thread.last_activity_at = datetime.now(timezone.utc)

    existing_sub = db.query(ThreadSubscription).filter(
        ThreadSubscription.thread_id == thread_id,
        ThreadSubscription.user_id == user.id,
    ).first()
    if not existing_sub:
        db.add(ThreadSubscription(thread_id=thread_id, user_id=user.id))

    log_activity(db, user.id, "create_post", "post", None, {"thread_id": thread_id})
    db.commit()
    db.refresh(post)

    return PostRead(
        id=post.id,
        thread_id=post.thread_id,
        author=PostAuthor.model_validate(user),
        body=post.body,
        position=post.position,
        edited_at=post.edited_at,
        created_at=post.created_at,
    )


@router.put("/{thread_id}/posts/{post_id}", response_model=PostRead)
def update_post(
    council_id: int,
    thread_id: int,
    post_id: int,
    body: PostUpdate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    post = db.query(Post).filter(Post.id == post_id, Post.thread_id == thread_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != user.id:
        raise HTTPException(403, "Only the author can edit this post")

    post.body = body.body
    post.edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)

    return PostRead(
        id=post.id,
        thread_id=post.thread_id,
        author=PostAuthor.model_validate(post.author),
        body=post.body,
        position=post.position,
        edited_at=post.edited_at,
        created_at=post.created_at,
    )


@router.post("/{thread_id}/subscribe")
def toggle_subscription(
    council_id: int,
    thread_id: int,
    body: SubscribeRequest,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    require_council_access(council_id, user, db)

    thread = db.query(Thread).filter(Thread.id == thread_id, Thread.council_id == council_id).first()
    if not thread:
        raise HTTPException(404, "Thread not found")

    sub = db.query(ThreadSubscription).filter(
        ThreadSubscription.thread_id == thread_id,
        ThreadSubscription.user_id == user.id,
    ).first()

    if sub:
        if body.muted:
            sub.muted = True
        else:
            db.delete(sub)
    else:
        db.add(ThreadSubscription(thread_id=thread_id, user_id=user.id, muted=body.muted))

    db.commit()
    return {"ok": True}


def _thread_detail(thread: Thread, user: User, db: DBSession) -> ThreadDetail:
    if not thread.posts:
        thread = (
            db.query(Thread)
            .options(
                joinedload(Thread.author),
                joinedload(Thread.tags),
                joinedload(Thread.posts).joinedload(Post.author),
            )
            .filter(Thread.id == thread.id)
            .first()
        )

    sub = db.query(ThreadSubscription).filter(
        ThreadSubscription.thread_id == thread.id,
        ThreadSubscription.user_id == user.id,
    ).first()

    return ThreadDetail(
        id=thread.id,
        council_id=thread.council_id,
        title=thread.title,
        author=PostAuthor.model_validate(thread.author),
        pinned=thread.pinned,
        locked=thread.locked,
        reply_count=thread.reply_count,
        tags=[TagRead.model_validate(tag) for tag in thread.tags],
        posts=[
            PostRead(
                id=p.id,
                thread_id=p.thread_id,
                author=PostAuthor.model_validate(p.author),
                body=p.body,
                position=p.position,
                edited_at=p.edited_at,
                created_at=p.created_at,
            )
            for p in thread.posts
        ],
        is_subscribed=sub is not None,
        is_muted=sub.muted if sub else False,
        last_activity_at=thread.last_activity_at,
        created_at=thread.created_at,
    )
