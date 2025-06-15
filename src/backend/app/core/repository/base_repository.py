from datetime import datetime, timezone
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from beanie import Document, DeleteRules

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

    async def get_by_id(
        self,
        entity_id: str,
        *,
        fetch_links: bool = False,
        fetch_fields: Optional[Dict[str, int]] = None,
        default_fetch_depth: int = 0,
    ) -> Optional[T]:
        """Get an entity by its ID"""
        if fetch_fields:
            fetch_links = True
        entity = await self.model_class.find_one(
            {"_id": entity_id},
            fetch_links=fetch_links,
            nesting_depth=default_fetch_depth,
            nesting_depths_per_field=fetch_fields,
        )

        return entity

    async def get_by_field(
        self,
        field_name: str,
        field_value: Any,
        *,
        fetch_links: bool = False,
        fetch_fields: Optional[Dict[str, int]] = None,
        default_fetch_depth: int = 0,
    ) -> Optional[T]:
        """Get an entity by field value"""
        if fetch_fields:
            fetch_links = True
        entity = await self.model_class.find_one(
            {field_name: field_value},
            fetch_links=fetch_links,
            nesting_depth=default_fetch_depth,
            nesting_depths_per_field=fetch_fields,
        )
        return entity

    async def get_one_by_criteria(
        self,
        filter_criteria: Optional[Dict[str, Any]] = None,
        *,
        fetch_links: bool = False,
        fetch_fields: Optional[Dict[str, int]] = None,
        default_fetch_depth: int = 0,
    ) -> Optional[T]:
        """Get entity filtered by criteria"""
        instance = await self.get_all(
            filter_criteria,
            fetch_links=fetch_links,
            fetch_fields=fetch_fields,
            default_fetch_depth=default_fetch_depth,
        )
        return instance[0] if instance else None

    async def get_all(
        self,
        filter_criteria: Optional[Dict[str, Any]] = None,
        *,
        fetch_links: bool = False,
        fetch_fields: Optional[Dict[str, int]] = None,
        default_fetch_depth: int = 0,
    ) -> List[T]:
        """Get all entities, optionally filtered"""
        if fetch_fields:
            fetch_links = True

        if filter_criteria is None:
            filter_criteria = {}

        entity = await self.model_class.find(
            filter_criteria,
            fetch_links=fetch_links,
            nesting_depth=default_fetch_depth,
            nesting_depths_per_field=fetch_fields,
        ).to_list()

        return entity

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

    async def delete(
        self, entity_id: str, *, link_rule: DeleteRules | None = None
    ) -> bool:
        """Delete an entity"""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return False

        await entity.delete(link_rule=link_rule)
        return True

    async def save(self, entity: T) -> T:
        """Save an entity (update if exists, create if new)"""
        # Update timestamp if applicable
        if hasattr(entity, "updated_at"):
            entity.updated_at = datetime.now(timezone.utc)

        await entity.save()
        return entity
