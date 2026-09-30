from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
from datetime import datetime
from api.database import Base


class Thread(Base):
    __tablename__ = "threads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    council_id: Mapped[int] = mapped_column(ForeignKey("councils.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    locked: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    reply_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    last_activity_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="now()")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="now()")

    __table_args__ = (
        Index("ix_threads_council_activity", "council_id", last_activity_at.desc()),
    )

    council: Mapped["Council"] = relationship()
    author: Mapped["User"] = relationship()
    posts: Mapped[list["Post"]] = relationship(back_populates="thread", order_by="Post.position")
    tags: Mapped[list["Tag"]] = relationship(secondary="thread_tags")
    subscriptions: Mapped[list["ThreadSubscription"]] = relationship(back_populates="thread")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="now()")
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR)

    __table_args__ = (
        Index("ix_posts_thread", "thread_id"),
        Index("ix_posts_search", "search_vector", postgresql_using="gin"),
    )

    thread: Mapped["Thread"] = relationship(back_populates="posts")
    author: Mapped["User"] = relationship()


class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("council_id", "name", name="uq_tag_council"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    council_id: Mapped[int] = mapped_column(ForeignKey("councils.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str] = mapped_column(Text, nullable=False, server_default="'gray'")


class ThreadTag(Base):
    __tablename__ = "thread_tags"

    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)


class ThreadSubscription(Base):
    __tablename__ = "thread_subscriptions"
    __table_args__ = (
        UniqueConstraint("thread_id", "user_id", name="uq_thread_sub"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    muted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default="now()")

    thread: Mapped["Thread"] = relationship(back_populates="subscriptions")
    user: Mapped["User"] = relationship()


from api.models.auth import User  # noqa: E402, F401
from api.models.councils import Council  # noqa: E402, F401
