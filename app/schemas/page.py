from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class PageBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    sidecard: dict[str, Any] | None = None
    content: str = ""
    slug: str | None = Field(default=None, max_length=255)
    images: int | None = None


class PageCreate(PageBase):
    category_ids: list[int] = []
    tag_ids: list[int] = []


class PageUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    sidecard: dict[str, Any] | None = None
    content: str | None = None
    slug: str | None = Field(default=None, max_length=255)
    images: int | None = None
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
    outgoing_page_ids: list[int]
    incoming_page_ids: list[int]


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    parent_id: int | None
    category_name: str


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tag_name: str
