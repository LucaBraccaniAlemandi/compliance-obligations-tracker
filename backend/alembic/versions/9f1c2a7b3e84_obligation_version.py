"""obligation optimistic-lock version

Revision ID: 9f1c2a7b3e84
Revises: 4dad2435c041
Create Date: 2026-06-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9f1c2a7b3e84'
down_revision: Union[str, None] = '4dad2435c041'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default backfills existing rows; column stays NOT NULL.
    op.add_column(
        'obligations',
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
    )


def downgrade() -> None:
    op.drop_column('obligations', 'version')
