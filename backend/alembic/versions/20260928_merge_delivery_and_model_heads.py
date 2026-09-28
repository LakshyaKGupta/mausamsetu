"""merge delivery outbox and national model migration heads

Revision ID: 20260928_merge_delivery_and_model_heads
Revises: 20260928_delivery_outbox, f61b7ae2d551
Create Date: 2026-09-28
"""

from typing import Sequence, Union


revision: str = "20260928_merge_delivery_and_model_heads"
down_revision: Union[str, Sequence[str], None] = (
    "20260928_delivery_outbox",
    "f61b7ae2d551",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Merge independent schema branches without changing database objects."""


def downgrade() -> None:
    """Unmerge independent schema branches without changing database objects."""
