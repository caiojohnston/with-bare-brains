from pydantic import BaseModel, ConfigDict


class ImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    page_id: int
    storage_key: str
    alt_text: str
    mime_type: str
    public_url: str
