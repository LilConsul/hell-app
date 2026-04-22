from app.storage.service import StorageService


async def get_storage_service() -> StorageService:
    """
    Dependency for getting storage service instance.

    Returns:
        StorageService: Storage service instance
    """
    return StorageService()
