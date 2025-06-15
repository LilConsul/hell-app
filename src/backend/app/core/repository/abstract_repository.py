from abc import ABC, abstractmethod
from typing import Any, Dict, Generic, List, Optional, TypeVar

T = TypeVar("T")


class AbstractRepository(ABC, Generic[T]):
    """Abstract base class for all repositories"""

    @abstractmethod
    async def create(self, data: Dict[str, Any]) -> T:
        """Create a new entity"""
        pass

    @abstractmethod
    async def get_by_id(
        self,
        entity_id: str,
        fetch_links: bool = False,
        fetch_fields: Optional[dict[str:int]] = None,
        default_fetch_depth: int = 0,
    ) -> Optional[T]:
        """Get an entity by its ID"""
        pass

    @abstractmethod
    async def get_by_field(
        self,
        field_name: str,
        field_value: Any,
        fetch_links: bool = False,
        fetch_fields: Optional[dict[str:int]] = None,
        default_fetch_depth: int = 0,
    ) -> Optional[T]:
        """Get an entity by a specific field"""
        pass

    @abstractmethod
    async def get_all(
        self,
        filter_criteria: Optional[Dict[str, Any]] = None,
        fetch_links: bool = False,
        fetch_fields: Optional[dict[str:int]] = None,
        default_fetch_depth: int = 0,
    ) -> List[T]:
        """Get all entities, optionally filtered"""
        pass

    @abstractmethod
    async def update(self, entity_id: str, data: Dict[str, Any]) -> Optional[T]:
        """Update an entity"""
        pass

    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """Delete an entity"""
        pass

    @abstractmethod
    async def save(self, entity: T) -> T:
        """Save an entity (update if exists, create if new)"""
        pass