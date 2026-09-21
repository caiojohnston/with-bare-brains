from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import get_db
from app.models import Tag
from app.schemas import TagCreate, TagRead, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])

@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(payload: TagCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Tag).where(Tag.tag_name == payload.tag_name)):
        raise HTTPException(409, "Tag already exists")
    tag = Tag(**payload.model_dump()); db.add(tag); db.commit(); db.refresh(tag); return tag

@router.get("", response_model=list[TagRead])
def list_tags(db: Session = Depends(get_db)):
    return list(db.scalars(select(Tag).order_by(Tag.tag_name)))

@router.patch("/{tag_id}", response_model=TagRead)
def update_tag(tag_id: int, payload: TagUpdate, db: Session = Depends(get_db)):
    tag = db.get(Tag, tag_id)
    if not tag: raise HTTPException(404, "Tag not found")
    if db.scalar(select(Tag).where(Tag.tag_name == payload.tag_name, Tag.id != tag_id)):
        raise HTTPException(409, "Tag already exists")
    tag.tag_name = payload.tag_name; db.commit(); db.refresh(tag); return tag

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.get(Tag, tag_id)
    if not tag: raise HTTPException(404, "Tag not found")
    db.delete(tag); db.commit()
