import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from api.auth import current_user, require
from api.database import get_db
from api.audit import log_activity
from api.models.auth import User, Role, UserRole
from api.models.councils import Council, CouncilMember
from api.models.notifications import ActivityLog
from api.schemas.auth import UserRead, UserCreate, UserUpdate
from api.schemas.councils import CouncilMemberRead, AddMemberRequest

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/councils")
def admin_list_councils(
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    councils = db.query(Council).order_by(Council.name).all()
    result = []
    for c in councils:
        count = db.query(func.count(CouncilMember.id)).filter(CouncilMember.council_id == c.id).scalar()
        result.append({
            "id": c.id, "name": c.name, "slug": c.slug,
            "description": c.description, "active": c.active,
            "member_count": count, "created_at": str(c.created_at),
        })
    return result


@router.get("/councils/{council_id}")
def admin_get_council(
    council_id: int,
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    council = db.query(Council).filter(Council.id == council_id).first()
    if not council:
        raise HTTPException(404, "Council not found")

    count = db.query(func.count(CouncilMember.id)).filter(CouncilMember.council_id == council.id).scalar()
    return {
        "id": council.id, "name": council.name, "slug": council.slug,
        "description": council.description, "active": council.active,
        "member_count": count, "created_at": str(council.created_at),
    }


@router.get("/councils/{council_id}/members", response_model=list[CouncilMemberRead])
def admin_list_members(
    council_id: int,
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    members = (
        db.query(CouncilMember)
        .filter(CouncilMember.council_id == council_id)
        .order_by(CouncilMember.joined_at)
        .all()
    )
    result = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        if u:
            result.append(CouncilMemberRead(
                id=m.id, user_id=m.user_id,
                display_name=u.display_name, email=u.email,
                title=u.title, company=u.company,
                photo_url=u.photo_url, role=m.role, joined_at=m.joined_at,
            ))
    return result


@router.post("/councils/{council_id}/members", response_model=CouncilMemberRead)
def add_member(
    council_id: int,
    body: AddMemberRequest,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    council = db.query(Council).filter(Council.id == council_id).first()
    if not council:
        raise HTTPException(404, "Council not found")

    target = db.query(User).filter(User.id == body.user_id).first()
    if not target:
        raise HTTPException(404, "User not found")

    existing = db.query(CouncilMember).filter(
        CouncilMember.council_id == council_id,
        CouncilMember.user_id == body.user_id,
    ).first()
    if existing:
        raise HTTPException(409, "User is already a member of this council")

    member = CouncilMember(council_id=council_id, user_id=body.user_id, role=body.role)
    db.add(member)
    log_activity(db, user.id, "add_member", "council_member", None,
                 {"council_id": council_id, "user_id": body.user_id, "role": body.role})
    db.commit()
    db.refresh(member)

    return CouncilMemberRead(
        id=member.id, user_id=member.user_id,
        display_name=target.display_name, email=target.email,
        title=target.title, company=target.company,
        photo_url=target.photo_url, role=member.role, joined_at=member.joined_at,
    )


@router.delete("/councils/{council_id}/members/{user_id}", status_code=204)
def remove_member(
    council_id: int,
    user_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    member = db.query(CouncilMember).filter(
        CouncilMember.council_id == council_id,
        CouncilMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(404, "Membership not found")

    db.delete(member)
    log_activity(db, user.id, "remove_member", "council_member", None,
                 {"council_id": council_id, "user_id": user_id})
    db.commit()


@router.put("/councils/{council_id}/members/{user_id}")
def update_member_role(
    council_id: int,
    user_id: int,
    body: AddMemberRequest,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    member = db.query(CouncilMember).filter(
        CouncilMember.council_id == council_id,
        CouncilMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(404, "Membership not found")

    member.role = body.role
    log_activity(db, user.id, "update_member_role", "council_member", None,
                 {"council_id": council_id, "user_id": user_id, "role": body.role})
    db.commit()
    return {"ok": True}


@router.get("/users", response_model=list[UserRead])
def admin_list_users(
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, le=200),
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    query = db.query(User)
    if q:
        query = query.filter(User.display_name.ilike(f"%{q}%") | User.email.ilike(f"%{q}%"))

    users = query.order_by(User.display_name).offset((page - 1) * per_page).limit(per_page).all()
    return [UserRead.model_validate(u) for u in users]


@router.post("/users", response_model=UserRead, status_code=201)
def admin_create_user(
    body: UserCreate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(409, "A user with that email already exists")

    pw = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(
        email=body.email, display_name=body.display_name,
        password_hash=pw, title=body.title, company=body.company,
    )
    db.add(new_user)
    db.flush()

    role = db.query(Role).filter(Role.key == body.role_key).first()
    if role:
        db.add(UserRole(user_id=new_user.id, role_id=role.id, granted_by=user.email))

    log_activity(db, user.id, "create_user", "user", new_user.id, {"email": body.email})
    db.commit()
    db.refresh(new_user)

    return UserRead.model_validate(new_user)


@router.put("/users/{user_id}", response_model=UserRead)
def admin_update_user(
    user_id: int,
    body: UserUpdate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")

    if body.display_name is not None:
        target.display_name = body.display_name
    if body.active is not None:
        target.active = body.active

    log_activity(db, user.id, "update_user", "user", user_id)
    db.commit()
    db.refresh(target)

    return UserRead.model_validate(target)


@router.get("/activity")
def activity_report(
    days: int = Query(default=30, ge=1, le=365),
    db: DBSession = Depends(get_db),
    _: None = Depends(require("admin.full")),
):
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.created_at >= cutoff)
        .order_by(ActivityLog.created_at.desc())
        .limit(500)
        .all()
    )

    action_counts = {}
    for log in logs:
        action_counts[log.action] = action_counts.get(log.action, 0) + 1

    return {
        "period_days": days,
        "total_events": len(logs),
        "action_counts": action_counts,
        "recent": [
            {
                "id": log.id, "user_id": log.user_id,
                "action": log.action, "entity_type": log.entity_type,
                "entity_id": log.entity_id, "created_at": str(log.created_at),
            }
            for log in logs[:50]
        ],
    }
