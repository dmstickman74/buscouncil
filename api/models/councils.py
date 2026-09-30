from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from api.database import Base


class Council(Base):
    __tablename__ = "councils"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="now()")

    members: Mapped[list["CouncilMember"]] = relationship(back_populates="council")


class CouncilMember(Base):
    __tablename__ = "council_members"
    __table_args__ = (
        UniqueConstraint("council_id", "user_id", name="uq_council_member"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    council_id: Mapped[int] = mapped_column(ForeignKey("councils.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False, server_default="'member'")
    joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="now()")

    council: Mapped["Council"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="council_memberships")


from api.models.auth import User  # noqa: E402, F401
