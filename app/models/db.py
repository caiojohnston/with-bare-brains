from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core import Base


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    title: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )
    sidecard: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default=""
    )
    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    images: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    categories: Mapped[list["Category"]] = relationship(
        secondary="page_categories", back_populates="pages"
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary="page_tags", back_populates="pages"
    )
    outgoing_links: Mapped[list["PageLink"]] = relationship(
        foreign_keys="PageLink.origin_id", back_populates="origin", cascade="all, delete-orphan"
    )
    incoming_links: Mapped[list["PageLink"]] = relationship(
        foreign_keys="PageLink.destiny_id", back_populates="destiny", cascade="all, delete-orphan"
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tag_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    pages: Mapped[list[Page]] = relationship(
        secondary="page_tags", back_populates="tags"
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True
    )
    category_name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False
    )
    parent: Mapped["Category | None"] = relationship(
        remote_side="Category.id",
        back_populates="children"
    )
    children: Mapped[list["Category"]] = relationship(
        back_populates="parent"
    )
    pages: Mapped[list[Page]] = relationship(
        secondary="page_categories",
        back_populates="categories"
    )


class PageLink(Base):
    __tablename__ = "links_pages"
    __table_args__ = (UniqueConstraint("origin_id", "destiny_id"),)

    origin_id: Mapped[int] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), primary_key=True
    )
    destiny_id: Mapped[int] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), primary_key=True
    )

    origin: Mapped[Page] = relationship(
        foreign_keys=[origin_id], back_populates="outgoing_links"
    )
    destiny: Mapped[Page] = relationship(
        foreign_keys=[destiny_id], back_populates="incoming_links"
    )


class PageCategory(Base):
    __tablename__ = "page_categories"

    page_id: Mapped[int] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True
    )


class PageTag(Base):
    __tablename__ = "page_tags"

    page_id: Mapped[int] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[int] = mapped_column(
        ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    )
