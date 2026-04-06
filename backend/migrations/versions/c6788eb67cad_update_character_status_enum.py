"""update character status enum

Revision ID: c6788eb67cad
Revises: 5ab40f0c73ed
Create Date: 2026-04-06 19:56:59.165260

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6788eb67cad'
down_revision: Union[str, None] = '5ab40f0c73ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE characterstatus ADD VALUE IF NOT EXISTS 'energetic'")
    op.execute("ALTER TYPE characterstatus ADD VALUE IF NOT EXISTS 'recovering'")
    op.execute("ALTER TYPE characterstatus ADD VALUE IF NOT EXISTS 'tired'")
    op.execute("ALTER TYPE characterstatus ADD VALUE IF NOT EXISTS 'struggling'")


def downgrade() -> None:
    pass