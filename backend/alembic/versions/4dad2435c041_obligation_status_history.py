"""obligation status history

Revision ID: 4dad2435c041
Revises: 7cbe15c6512d
Create Date: 2026-06-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '4dad2435c041'
down_revision: Union[str, None] = '7cbe15c6512d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Reuse the enum type already created by the obligations table.
obligation_status = postgresql.ENUM(
    'pending', 'in_progress', 'submitted', 'done',
    name='obligationstatus',
    create_type=False,
)


def upgrade() -> None:
    op.create_table(
        'obligation_status_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('obligation_id', sa.Integer(), nullable=False),
        sa.Column('from_status', obligation_status, nullable=False),
        sa.Column('to_status', obligation_status, nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['obligation_id'], ['obligations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_obligation_status_history_id'), 'obligation_status_history', ['id'], unique=False)
    op.create_index(op.f('ix_obligation_status_history_obligation_id'), 'obligation_status_history', ['obligation_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_obligation_status_history_obligation_id'), table_name='obligation_status_history')
    op.drop_index(op.f('ix_obligation_status_history_id'), table_name='obligation_status_history')
    op.drop_table('obligation_status_history')
