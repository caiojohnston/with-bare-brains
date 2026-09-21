from pydantic import BaseModel, ConfigDict, Field


class TagCreate(BaseModel):
    tag_name: str = Field(min_length=1, max_length=100)


class TagUpdate(BaseModel):
    tag_name: str = Field(min_length=1, max_length=100)


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tag_name: str
