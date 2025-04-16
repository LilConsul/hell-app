from datetime import datetime, timezone
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from beanie import Document

from app.core.repository.abstract_repository import AbstractRepository

T = TypeVar("T", bound=Document)


class BaseRepository(AbstractRepository[T], Generic[T]):
    """Base repository implementation for Beanie models"""

    def __init__(self, model_class: Type[T]):
        self.model_class = model_class

    async def create(self, data: Dict[str, Any]) -> T:
        """Create a new entity"""
        entity = self.model_class(**data)
        await entity.create()
        return entity

    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """Get an entity by its ID"""
        return await self.model_class.find_one({self.model_class.id: entity_id})

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[T]:
        return await self.model_class.find_one({field_name: field_value})

    async def get_all(
        self, filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[T]:
        """Get all entities, optionally filtered"""
        if filter_criteria:
            return await self.model_class.find(filter_criteria).to_list()
        return await self.model_class.find_all().to_list()

    async def update(self, entity_id: str, data: Dict[str, Any]) -> Optional[T]:
        """Update an entity"""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return None

        # Add updated_at timestamp if the entity has this field
        if hasattr(self.model_class, "updated_at"):
            data["updated_at"] = datetime.now(timezone.utc)

        await entity.update({"$set": data})
        return await self.get_by_id(entity_id)  # Refresh after update

    async def delete(self, entity_id: str) -> bool:
        """Delete an entity"""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return False

        await entity.delete()
        return True

    async def save(self, entity: T) -> T:
        """Save an entity (update if exists, create if new)"""
        # Update timestamp if applicable
        if hasattr(entity, "updated_at"):
            entity.updated_at = datetime.now(timezone.utc)

        await entity.save()
        return entity
