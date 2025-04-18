from datetime import datetime, timezone

from pydantic import Field


class TimestampMixin:
    """Mixin to add created_at and updated_at fields to models"""

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
