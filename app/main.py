from fastapi import FastAPI
from sqlalchemy import text

from app.api import categories, pages, tags
from app.core import engine, settings

app = FastAPI()
app.include_router(pages.router, prefix=settings.api_prefix)
app.include_router(categories.router, prefix=settings.api_prefix)
app.include_router(tags.router, prefix=settings.api_prefix)


@app.get("/health", tags=["system"])
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}
