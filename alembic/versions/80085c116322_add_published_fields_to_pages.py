"""add published fields to pages

Revision ID: 80085c116322
Revises: c8e33c558d73
Create Date: 2026-10-14 19:36:49.989150

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '80085c116322'
down_revision: Union[str, Sequence[str], None] = 'c8e33c558d73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("pages", sa.Column("published_at", sa.DateTime(), nullable=True))
    op.add_column("pages", sa.Column("published_content_hash", sa.String(length=64), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("pages", "published_content_hash")
    op.drop_column("pages", "published_at")
