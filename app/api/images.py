import uuid
from typing import BinaryIO

import boto3
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import get_db, settings
from app.models import Image
from app.schemas import ImageRead

router = APIRouter(prefix="/images", tags=["images"])

# Allowed image MIME types
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
}

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes


def get_r2_client():
    """Create and return an R2 S3 client."""
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
    )


def generate_storage_key(page_id: int, original_filename: str) -> str:
    """Generate a unique storage key to avoid filename collisions."""
    file_extension = original_filename.split(".")[-1] if "." in original_filename else ""
    unique_id = str(uuid.uuid4())
    return f"pages/{page_id}/{unique_id}.{file_extension}"


def get_public_url(storage_key: str) -> str:
    """Generate the public URL for an image."""
    return f"{settings.r2_public_domain}/{storage_key}"


@router.post("/upload/{page_id}", response_model=ImageRead)
async def upload_image(
    page_id: int,
    file: UploadFile = File(...),
    alt_text: str = Form(..., description="Alt text for accessibility"),
    db: Session = Depends(get_db),
):
    """
    Upload an image to R2 and create a database record.

    - **page_id**: ID of the page to associate the image with
    - **file**: Image file to upload (max 10MB, allowed types: jpeg, png, gif, webp, svg)
    - **alt_text**: Alt text for accessibility (required)
    """
    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to beginning

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    # Validate that page exists
    from app.models import Page
    page = db.scalar(select(Page).where(Page.id == page_id))
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    # Generate storage key
    storage_key = generate_storage_key(page_id, file.filename or "image")

    # Upload to R2
    try:
        r2_client = get_r2_client()
        r2_client.upload_fileobj(
            file.file,
            settings.r2_bucket,
            storage_key,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to R2: {str(e)}")

    # Create database record
    new_image = Image(
        page_id=page_id,
        storage_key=storage_key,
        alt_text=alt_text,
        mime_type=file.content_type,
    )

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    # Return with public URL
    return ImageRead(
        id=new_image.id,
        page_id=new_image.page_id,
        storage_key=new_image.storage_key,
        alt_text=new_image.alt_text,
        mime_type=new_image.mime_type,
        public_url=get_public_url(new_image.storage_key),
    )


@router.get("/page/{page_id}", response_model=list[ImageRead])
async def get_page_images(page_id: int, db: Session = Depends(get_db)):
    """Get all images for a specific page."""
    images = list(db.scalars(select(Image).where(Image.page_id == page_id)))

    return [
        ImageRead(
            id=img.id,
            page_id=img.page_id,
            storage_key=img.storage_key,
            alt_text=img.alt_text,
            mime_type=img.mime_type,
            public_url=get_public_url(img.storage_key),
        )
        for img in images
    ]


@router.delete("/{image_id}")
async def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image from database and R2 storage."""
    image = db.scalar(select(Image).where(Image.id == image_id))
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete from R2
    try:
        r2_client = get_r2_client()
        r2_client.delete_object(Bucket=settings.r2_bucket, Key=image.storage_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete from R2: {str(e)}")

    # Delete from database
    db.delete(image)
    db.commit()

    return {"message": "Image deleted successfully"}
