from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/knowledge_base"
    api_prefix: str = "/api/v1"

    # R2 Storage Configuration
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_account_id: str
    r2_bucket: str
    r2_public_domain: str

    # Admin authentication
    admin_password: str
    jwt_secret_key: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
