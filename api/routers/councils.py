from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from api.auth import current_user, is_admin
from api.database import get_db
from api.audit import log_activity
from api.models.auth import User
from api.models.councils import Council, CouncilMember
from api.schemas.councils import CouncilRead, CouncilCreate, CouncilUpdate

router = APIRouter(prefix="/councils", tags=["councils"])


@router.get("", response_model=list[CouncilRead])
def list_councils(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    if is_admin(user, db):
        councils = db.query(Council).order_by(Council.name).all()
    else:
        councils = (
            db.query(Council)
            .join(CouncilMember)
            .filter(CouncilMember.user_id == user.id)
            .order_by(Council.name)
            .all()
        )

    result = []
    for c in councils:
        count = db.query(func.count(CouncilMember.id)).filter(CouncilMember.council_id == c.id).scalar()
        result.append(CouncilRead(
            id=c.id, name=c.name, slug=c.slug, description=c.description,
            active=c.active, member_count=count, created_at=c.created_at,
        ))
    return result


@router.get("/{slug}", response_model=CouncilRead)
def get_council(slug: str, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    council = db.query(Council).filter(Council.slug == slug).first()
    if not council:
        raise HTTPException(404, "Council not found")

    if not is_admin(user, db):
        membership = db.query(CouncilMember).filter(
            CouncilMember.council_id == council.id,
            CouncilMember.user_id == user.id,
        ).first()
        if not membership:
            raise HTTPException(403, "Not a member of this council")

    count = db.query(func.count(CouncilMember.id)).filter(CouncilMember.council_id == council.id).scalar()

    return CouncilRead(
        id=council.id, name=council.name, slug=council.slug,
        description=council.description, active=council.active,
        member_count=count, created_at=council.created_at,
    )


@router.post("", response_model=CouncilRead, status_code=201)
def create_council(body: CouncilCreate, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    if not is_admin(user, db):
        raise HTTPException(403, "Only admins can create councils")

    existing = db.query(Council).filter((Council.slug == body.slug) | (Council.name == body.name)).first()
    if existing:
        raise HTTPException(409, "A council with that name or slug already exists")

    council = Council(name=body.name, slug=body.slug, description=body.description)
    db.add(council)
    log_activity(db, user.id, "create_council", "council", None, {"name": body.name})
    db.commit()
    db.refresh(council)

    return CouncilRead(
        id=council.id, name=council.name, slug=council.slug,
        description=council.description, active=council.active,
        member_count=0, created_at=council.created_at,
    )


@router.put("/{council_id}", response_model=CouncilRead)
def update_council(council_id: int, body: CouncilUpdate, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    if not is_admin(user, db):
        raise HTTPException(403, "Only admins can update councils")

    council = db.query(Council).filter(Council.id == council_id).first()
    if not council:
        raise HTTPException(404, "Council not found")

    if body.name is not None:
        council.name = body.name
    if body.description is not None:
        council.description = body.description
    if body.active is not None:
        council.active = body.active

    log_activity(db, user.id, "update_council", "council", council_id)
    db.commit()
    db.refresh(council)

    count = db.query(func.count(CouncilMember.id)).filter(CouncilMember.council_id == council.id).scalar()

    return CouncilRead(
        id=council.id, name=council.name, slug=council.slug,
        description=council.description, active=council.active,
        member_count=count, created_at=council.created_at,
    )
