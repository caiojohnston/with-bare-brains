from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_auth
from app.core import get_db
from app.models import Category
from app.schemas import CategoryCreate, CategoryRead, CategoryTree, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


def build_tree(categories: list[Category], parent_id=None):
    by_parent = {}
    for c in categories:
        by_parent.setdefault(c.parent_id, []).append(c)
    def node(c):
        return {"id": c.id, "parent_id": c.parent_id, "category_name": c.category_name,
                "children": [node(x) for x in by_parent.get(c.id, [])]}
    return [node(c) for c in by_parent.get(parent_id, [])]


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_auth),
):
    if db.scalar(select(Category).where(Category.category_name == payload.category_name)):
        raise HTTPException(409, "Category already exists")
    if payload.parent_id is not None and not db.get(Category, payload.parent_id):
        raise HTTPException(400, "Parent category not found")
    category = Category(**payload.model_dump())
    db.add(category); db.commit(); db.refresh(category)
    return category


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return list(db.scalars(select(Category).order_by(Category.category_name)))


@router.get("/tree", response_model=list[CategoryTree])
def category_tree(db: Session = Depends(get_db)):
    return build_tree(list(db.scalars(select(Category).order_by(Category.category_name))))


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_auth),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(404, "Category not found")
    data = payload.model_dump(exclude_unset=True)
    if "category_name" in data and db.scalar(select(Category).where(Category.category_name == data["category_name"], Category.id != category_id)):
        raise HTTPException(409, "Category already exists")
    if "parent_id" in data:
        if data["parent_id"] == category_id:
            raise HTTPException(400, "A category cannot be its own parent")
        if data["parent_id"] is not None and not db.get(Category, data["parent_id"]):
            raise HTTPException(400, "Parent category not found")
    for k, v in data.items(): setattr(category, k, v)
    db.commit(); db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_auth),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(404, "Category not found")
    db.delete(category); db.commit()
