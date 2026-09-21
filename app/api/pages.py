import boto3
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload
from slugify import slugify

from app.core import get_db, settings
from app.models import Category, Image, Page, Tag, PageLink
from app.schemas import PageCreate, PageRead, PageSummary, PageUpdate

router = APIRouter(prefix="/pages", tags=["pages"])


def unique_slug(db: Session, value: str, current_id: int | None = None) -> str:
    base = slugify(value)
    if not base:
        raise HTTPException(400, "title/slug must produce a valid slug")
    candidate, n = base, 2
    while True:
        q = select(Page).where(Page.slug == candidate)
        if current_id is not None:
            q = q.where(Page.id != current_id)
        if db.scalar(q) is None:
            return candidate
        candidate = f"{base}-{n}"
        n += 1


def get_page_query():
    return select(Page).options(
        selectinload(Page.categories),
        selectinload(Page.tags),
        selectinload(Page.images),
        selectinload(Page.outgoing_links),
        selectinload(Page.incoming_links),
    )


def serialize_page(page: Page) -> dict:
    def get_public_url(storage_key: str) -> str:
        return f"{settings.r2_public_domain}/{storage_key}"

    return {
        "id": page.id,
        "title": page.title,
        "sidecard": page.sidecard,
        "content": page.content,
        "slug": page.slug,
        "images": [
            {
                "id": img.id,
                "page_id": img.page_id,
                "storage_key": img.storage_key,
                "alt_text": img.alt_text,
                "mime_type": img.mime_type,
                "public_url": get_public_url(img.storage_key),
            }
            for img in page.images
        ],
        "categories": page.categories,
        "tags": page.tags,
        "outgoing_page_ids": [x.destiny_id for x in page.outgoing_links],
        "incoming_page_ids": [x.origin_id for x in page.incoming_links],
    }


@router.post("", response_model=PageRead, status_code=status.HTTP_201_CREATED)
def create_page(payload: PageCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Page).where(Page.title == payload.title)):
        raise HTTPException(409, "A page with this title already exists")

    category_ids = set(payload.category_ids)
    tag_ids = set(payload.tag_ids)
    categories = list(db.scalars(select(Category).where(Category.id.in_(category_ids)))) if category_ids else []
    tags = list(db.scalars(select(Tag).where(Tag.id.in_(tag_ids)))) if tag_ids else []
    if len(categories) != len(category_ids):
        raise HTTPException(400, "One or more category_ids do not exist")
    if len(tags) != len(tag_ids):
        raise HTTPException(400, "One or more tag_ids do not exist")

    page = Page(
        title=payload.title,
        sidecard=payload.sidecard,
        content=payload.content,
        slug=unique_slug(db, payload.slug or payload.title),
        categories=categories,
        tags=tags,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    page = db.scalar(get_page_query().where(Page.id == page.id))
    return serialize_page(page)


@router.get("", response_model=list[PageSummary])
def list_pages(
    q: str | None = Query(default=None),
    category_id: int | None = None,
    tag_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(Page).distinct()
    if q:
        query = func.plainto_tsquery(
            "portuguese", q
        )

        stmt = (
            select(Page)
            .where(Page.search_vector.op("@@")(query))
            .order_by(
                func.ts_rank(
                    Page.search_vector,
                    query
                ).desc()
            )
        )
    if category_id is not None:
        stmt = stmt.join(Page.categories).where(Category.id == category_id)
    if tag_id is not None:
        stmt = stmt.join(Page.tags).where(Tag.id == tag_id)
    return list(db.scalars(stmt.order_by(Page.id).offset(offset).limit(limit)))


@router.get("/{page_id}", response_model=PageRead)
def get_page(page_id: int, db: Session = Depends(get_db)):
    page = db.scalar(get_page_query().where(Page.id == page_id))
    if not page:
        raise HTTPException(404, "Page not found")
    return serialize_page(page)


@router.patch("/{page_id}", response_model=PageRead)
def update_page(page_id: int, payload: PageUpdate, db: Session = Depends(get_db)):
    page = db.scalar(get_page_query().where(Page.id == page_id))
    if not page:
        raise HTTPException(404, "Page not found")

    data = payload.model_dump(exclude_unset=True)
    category_ids = data.pop("category_ids", None)
    tag_ids = data.pop("tag_ids", None)

    if "title" in data and db.scalar(select(Page).where(Page.title == data["title"], Page.id != page_id)):
        raise HTTPException(409, "A page with this title already exists")
    if "slug" in data:
        data["slug"] = unique_slug(db, data["slug"] or page.title, page_id)

    for key, value in data.items():
        setattr(page, key, value)

    if category_ids is not None:
        categories = list(db.scalars(select(Category).where(Category.id.in_(set(category_ids))))) if category_ids else []
        if len(categories) != len(set(category_ids)):
            raise HTTPException(400, "One or more category_ids do not exist")
        page.categories = categories
    if tag_ids is not None:
        tags = list(db.scalars(select(Tag).where(Tag.id.in_(set(tag_ids))))) if tag_ids else []
        if len(tags) != len(set(tag_ids)):
            raise HTTPException(400, "One or more tag_ids do not exist")
        page.tags = tags

    db.commit()
    page = db.scalar(get_page_query().where(Page.id == page_id))
    return serialize_page(page)


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(page_id: int, db: Session = Depends(get_db)):
    page = db.scalar(get_page_query().where(Page.id == page_id))
    if not page:
        raise HTTPException(404, "Page not found")

    # Delete images from R2 before deleting page
    if page.images:
        try:
            r2_client = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
            )
            for image in page.images:
                r2_client.delete_object(Bucket=settings.r2_bucket, Key=image.storage_key)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete images from R2: {str(e)}")

    db.delete(page)
    db.commit()


@router.post("/{page_id}/links/{destiny_id}", status_code=status.HTTP_201_CREATED)
def create_link(page_id: int, destiny_id: int, db: Session = Depends(get_db)):
    if page_id == destiny_id:
        raise HTTPException(400, "A page cannot link to itself")
    if not db.get(Page, page_id) or not db.get(Page, destiny_id):
        raise HTTPException(404, "Origin or destination page not found")
    if db.get(PageLink, (page_id, destiny_id)):
        raise HTTPException(409, "Link already exists")
    db.add(PageLink(origin_id=page_id, destiny_id=destiny_id))
    db.commit()
    return {"origin_id": page_id, "destiny_id": destiny_id}


@router.delete("/{page_id}/links/{destiny_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(page_id: int, destiny_id: int, db: Session = Depends(get_db)):
    link = db.get(PageLink, (page_id, destiny_id))
    if not link:
        raise HTTPException(404, "Link not found")
    db.delete(link)
    db.commit()
