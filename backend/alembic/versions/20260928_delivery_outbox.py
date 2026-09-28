"""add durable advisory delivery outbox

Revision ID: 20260928_delivery_outbox
Revises: 23ec75c72ce6
"""

from alembic import op
import sqlalchemy as sa


revision = "20260928_delivery_outbox"
down_revision = "23ec75c72ce6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "delivery_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("advisory_id", sa.Integer(), sa.ForeignKey("advisories.id"), nullable=False),
        sa.Column("channel", sa.String(length=30), nullable=False, server_default="pwa"),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="queued"),
        sa.Column("idempotency_key", sa.String(length=200), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("scheduled_at", sa.DateTime(), nullable=True),
        sa.Column("provider_message_id", sa.String(length=200), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("idempotency_key", name="uq_delivery_jobs_idempotency_key"),
    )
    op.create_index("ix_delivery_jobs_advisory_id", "delivery_jobs", ["advisory_id"])
    op.create_index("ix_delivery_jobs_status", "delivery_jobs", ["status"])
    op.create_index("ix_delivery_jobs_scheduled_at", "delivery_jobs", ["scheduled_at"])
    op.create_index("ix_delivery_jobs_provider_message_id", "delivery_jobs", ["provider_message_id"])


def downgrade() -> None:
    op.drop_index("ix_delivery_jobs_provider_message_id", table_name="delivery_jobs")
    op.drop_index("ix_delivery_jobs_scheduled_at", table_name="delivery_jobs")
    op.drop_index("ix_delivery_jobs_status", table_name="delivery_jobs")
    op.drop_index("ix_delivery_jobs_advisory_id", table_name="delivery_jobs")
    op.drop_table("delivery_jobs")
