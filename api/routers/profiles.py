from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from api.auth import current_user, get_user_council_id, is_admin
from api.database import get_db
from api.models.auth import User
from api.models.councils import CouncilMember
from api.schemas.auth import UserRead, ProfileUpdate
from api.schemas.councils import CouncilMemberRead

router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=list[CouncilMemberRead])
def list_members(
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    council_id = get_user_council_id(user, db)
    if not council_id and not is_admin(user, db):
        return []

    if is_admin(user, db):
        query = db.query(CouncilMember).join(User)
    else:
        query = db.query(CouncilMember).join(User).filter(CouncilMember.council_id == council_id)

    members = query.order_by(User.display_name).all()

    return [
        CouncilMemberRead(
            id=m.id, user_id=m.user_id,
            display_name=m.user.display_name, email=m.user.email,
            title=m.user.title, company=m.user.company,
            photo_url=m.user.photo_url, role=m.role, joined_at=m.joined_at,
        )
        for m in members
    ]


@router.get("/{user_id}", response_model=UserRead)
def get_member_profile(
    user_id: int,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id, User.active == True).first()
    if not target:
        raise HTTPException(404, "User not found")

    return UserRead.model_validate(target)


@router.put("/me", response_model=UserRead)
def update_my_profile(
    body: ProfileUpdate,
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    if body.display_name is not None:
        user.display_name = body.display_name
    if body.bio is not None:
        user.bio = body.bio
    if body.title is not None:
        user.title = body.title
    if body.company is not None:
        user.company = body.company
    if body.phone is not None:
        user.phone = body.phone

    db.commit()
    db.refresh(user)

    return UserRead.model_validate(user)
