from pydantic import BaseModel, Field


class PageLinkCreate(BaseModel):
    origin_id: int = Field(gt=0)
    destiny_id: int = Field(gt=0)


class PageLinkRead(PageLinkCreate):
    pass
