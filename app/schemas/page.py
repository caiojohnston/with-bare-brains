from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.image import ImageRead


class PageBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    sidecard: dict[str, Any] | None = None
    content: str = ""
    slug: str | None = Field(default=None, max_length=255)


class PageCreate(PageBase):
    category_ids: list[int] = []
    tag_ids: list[int] = []


class PageUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    sidecard: dict[str, Any] | None = None
    content: str | None = None
    slug: str | None = Field(default=None, max_length=255)
    category_ids: list[int] | None = None
    tag_ids: list[int] | None = None


class PageSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str


class PageRead(PageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    categories: list["CategoryRead"]
    tags: list["TagRead"]
    images: list[ImageRead]
    outgoing_page_ids: list[int]
    incoming_page_ids: list[int]
    published_at: datetime | None


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    parent_id: int | None
    category_name: str


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tag_name: str


class PublishResult(BaseModel):
    status: Literal["published", "already_published", "reconciled"]
    commit_sha: str | None
    published_at: datetime
