import os
import bcrypt
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session as DBSession

from api.auth import current_user, get_user_permissions, get_user_council_id, SESSION_COOKIE
from api.config import SESSION_MAX_AGE_DAYS
from api.database import get_db
from api.audit import log_activity
from api.models.auth import User, Session as UserSession, Role, UserRole
from api.models.councils import CouncilMember, Council
from api.models.notifications import Notification
from api.schemas.auth import LoginRequest, WhoAmI, UserRead

router = APIRouter(tags=["auth"])


@router.post("/login")
def login(body: LoginRequest, response: Response, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email, User.active == True).first()
    if not user:
        raise HTTPException(401, "Invalid email or password")

    if not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(401, "Invalid email or password")

    token = os.urandom(32).hex()
    session = UserSession(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=SESSION_MAX_AGE_DAYS),
    )
    db.add(session)

    user.last_login_at = datetime.now(timezone.utc)
    log_activity(db, user.id, "login")
    db.commit()

    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="strict",
        secure=False,
        path="/",
        max_age=SESSION_MAX_AGE_DAYS * 86400,
    )

    return {"ok": True}


@router.post("/logout")
def logout(response: Response, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    token = None
    for cookie_name in [SESSION_COOKIE]:
        pass
    db.query(UserSession).filter(UserSession.user_id == user.id).delete()
    db.commit()

    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me", response_model=WhoAmI)
def me(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    perms = get_user_permissions(user, db)

    roles = (
        db.query(Role.key)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user.id)
        .all()
    )
    role_keys = [r[0] for r in roles]

    council_id = get_user_council_id(user, db)
    council_slug = None
    council_role = None
    if council_id:
        council = db.query(Council).filter(Council.id == council_id).first()
        if council:
            council_slug = council.slug
        membership = db.query(CouncilMember).filter(
            CouncilMember.council_id == council_id,
            CouncilMember.user_id == user.id,
        ).first()
        if membership:
            council_role = membership.role

    unread = db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.read == False,
    ).count()

    return WhoAmI(
        user=UserRead.model_validate(user),
        roles=role_keys,
        permissions=perms,
        council_id=council_id,
        council_slug=council_slug,
        council_role=council_role,
        unread_notifications=unread,
    )
