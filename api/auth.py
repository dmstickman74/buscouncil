from dataclasses import dataclass
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session as DBSession

from api.database import get_db
from api.models.auth import User, UserRole, RolePermission, Session as UserSession
from api.models.councils import CouncilMember

from datetime import datetime, timezone


SESSION_COOKIE = "council_session"


@dataclass
class Grant:
    permission: str
    scope: str
    granted: bool


def get_user_permissions(user: User, db: DBSession) -> dict[str, str]:
    SCOPE_RANK = {"own": 0, "team": 1, "all": 2}

    rows = (
        db.query(RolePermission.permission, RolePermission.scope)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .filter(UserRole.user_id == user.id)
        .all()
    )

    perms: dict[str, str] = {}
    for perm, scope in rows:
        if perm not in perms or SCOPE_RANK.get(scope, 0) > SCOPE_RANK.get(perms[perm], 0):
            perms[perm] = scope
    return perms


def user_grant(user: User, permission: str, db: DBSession) -> Grant:
    perms = get_user_permissions(user, db)
    if permission in perms:
        return Grant(permission=permission, scope=perms[permission], granted=True)
    return Grant(permission=permission, scope="", granted=False)


async def current_user(request: Request, db: DBSession = Depends(get_db)) -> User:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(401, "Authentication required")

    session = db.query(UserSession).filter(
        UserSession.token == token,
        UserSession.expires_at > datetime.now(timezone.utc),
    ).first()
    if not session:
        raise HTTPException(401, "Session expired or invalid")

    user = db.query(User).filter(User.id == session.user_id, User.active == True).first()
    if not user:
        raise HTTPException(401, "User not found or inactive")

    return user


def require(permission: str):
    async def checker(
        request: Request,
        user: User = Depends(current_user),
        db: DBSession = Depends(get_db),
    ):
        grant = user_grant(user, permission, db)
        if not grant.granted:
            raise HTTPException(403, f"Permission denied: {permission}")
        request.state.grant = grant
    return checker


def is_admin(user: User, db: DBSession) -> bool:
    return user_grant(user, "admin.full", db).granted


def require_council_access(council_id: int, user: User, db: DBSession):
    if is_admin(user, db):
        return
    membership = db.query(CouncilMember).filter(
        CouncilMember.council_id == council_id,
        CouncilMember.user_id == user.id,
    ).first()
    if not membership:
        raise HTTPException(403, "You are not a member of this council")


def get_user_council_id(user: User, db: DBSession) -> int | None:
    membership = db.query(CouncilMember).filter(
        CouncilMember.user_id == user.id,
    ).first()
    return membership.council_id if membership else None
