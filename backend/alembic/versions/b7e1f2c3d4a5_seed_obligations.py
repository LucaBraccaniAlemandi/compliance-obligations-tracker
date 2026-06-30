"""seed sample obligations

Inserts a handful of demo obligations (plus status history) so a tester can run
`alembic upgrade head` on a fresh database and immediately have data to play
with. `alembic downgrade -1` removes exactly these rows again.

Ids are left to the serial sequence rather than hard-coded, so the seed is safe
to apply on a database that already contains rows. History is linked back to its
parent by title via INSERT ... SELECT.

Revision ID: b7e1f2c3d4a5
Revises: 9f1c2a7b3e84
Create Date: 2026-06-30 00:00:00.000000

"""
from datetime import date
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'b7e1f2c3d4a5'
down_revision: Union[str, None] = '9f1c2a7b3e84'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Reuse the enum types already created by the obligations table.
obligation_type = postgresql.ENUM(
    'annual_report', 'franchise_tax', 'boi_report', 'registered_agent_renewal',
    name='obligationtype',
    create_type=False,
)
obligation_status = postgresql.ENUM(
    'pending', 'in_progress', 'submitted', 'done',
    name='obligationstatus',
    create_type=False,
)


# Lightweight table definition used only for bulk_insert. Columns omitted here
# (id, created_at, version) are filled by their server defaults.
obligations = sa.table(
    'obligations',
    sa.column('type', obligation_type),
    sa.column('title', sa.String),
    sa.column('description', sa.Text),
    sa.column('status', obligation_status),
    sa.column('due_date', sa.Date),
    sa.column('owner', sa.String),
    sa.column('requires_document', sa.Boolean),
    sa.column('document_path', sa.String),
    sa.column('company_tax_id', sa.String),
)


# Titles double as stable keys for linking history and for downgrade.
SEED_OBLIGATIONS = [
    {
        'type': 'annual_report',
        'title': 'Delaware Annual Report 2026',
        'description': 'File annual report with the Delaware Secretary of State.',
        'status': 'pending',
        'due_date': date(2026, 3, 1),
        'owner': 'Jane Smith',
        'requires_document': True,
        'document_path': None,
        'company_tax_id': '12-3456789',
    },
    {
        'type': 'franchise_tax',
        'title': 'Delaware Franchise Tax 2026',
        'description': 'Pay annual franchise tax to remain in good standing.',
        'status': 'in_progress',
        'due_date': date(2026, 6, 1),
        'owner': 'Jane Smith',
        'requires_document': False,
        'document_path': None,
        'company_tax_id': '12-3456789',
    },
    {
        'type': 'boi_report',
        'title': 'Beneficial Ownership Information Report',
        'description': 'Submit BOI report to FinCEN.',
        'status': 'submitted',
        'due_date': date(2026, 7, 15),
        'owner': 'Carlos Ruiz',
        'requires_document': True,
        'document_path': '/uploads/boi-acme-2026.pdf',
        'company_tax_id': '98-7654321',
    },
    {
        'type': 'registered_agent_renewal',
        'title': 'Registered Agent Renewal',
        'description': 'Renew registered agent service for the year.',
        'status': 'done',
        'due_date': date(2026, 1, 31),
        'owner': 'Carlos Ruiz',
        'requires_document': False,
        'document_path': None,
        'company_tax_id': '98-7654321',
    },
    {
        'type': 'annual_report',
        'title': 'California Statement of Information',
        'description': 'Overdue statement of information for California LLC.',
        'status': 'pending',
        'due_date': date(2026, 5, 15),
        'owner': 'Priya Patel',
        'requires_document': True,
        'document_path': None,
        'company_tax_id': '45-6789012',
    },
]

# Status transitions to record per obligation, keyed by title. Each tuple is
# (from_status, to_status); they are inserted in order.
SEED_STATUS_HISTORY = {
    'Delaware Franchise Tax 2026': [
        ('pending', 'in_progress'),
    ],
    'Beneficial Ownership Information Report': [
        ('pending', 'in_progress'),
        ('in_progress', 'submitted'),
    ],
    'Registered Agent Renewal': [
        ('pending', 'in_progress'),
        ('in_progress', 'submitted'),
        ('submitted', 'done'),
    ],
}


def upgrade() -> None:
    op.bulk_insert(obligations, SEED_OBLIGATIONS)

    # Link history to its parent by title. INSERT ... SELECT keeps us decoupled
    # from whatever serial ids the obligations actually received.
    for title, transitions in SEED_STATUS_HISTORY.items():
        for from_status, to_status in transitions:
            op.execute(
                sa.text(
                    "INSERT INTO obligation_status_history "
                    "(obligation_id, from_status, to_status) "
                    "SELECT id, :from_status, :to_status "
                    "FROM obligations WHERE title = :title"
                ).bindparams(
                    from_status=from_status,
                    to_status=to_status,
                    title=title,
                )
            )


def downgrade() -> None:
    titles = [row['title'] for row in SEED_OBLIGATIONS]
    # ON DELETE CASCADE clears the history rows, so deleting the obligations is
    # enough; we match on the titles we inserted above.
    op.execute(
        sa.text("DELETE FROM obligations WHERE title IN :titles").bindparams(
            sa.bindparam('titles', value=tuple(titles), expanding=True)
        )
    )
