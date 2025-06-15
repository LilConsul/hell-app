import io

from fastapi import Depends, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket

from .connection import get_database


class GridFSManager:
    def __init__(self, db):
        self.db = db

    async def save_file(self, file: UploadFile) -> dict:
        """Save file to GridFS and return file details"""
        contents = await file.read()
        fs = AsyncIOMotorGridFSBucket(self.db)

        file_id = await fs.upload_from_stream(
            filename=file.filename,
            source=io.BytesIO(contents),
            metadata={"content_type": file.content_type, "size": len(contents)},
        )

        return {
            "file_id": str(file_id),
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(contents),
        }

    async def get_file(self, file_id: str):
        """Retrieve a file from GridFS by ID"""
        from bson.objectid import ObjectId

        fs = AsyncIOMotorGridFSBucket(self.db)
        try:
            grid_out = await fs.open_download_stream(ObjectId(file_id))
            contents = await grid_out.read()
            return contents, grid_out.metadata
        except Exception as e:
            raise ValueError(f"File not found: {str(e)}")


def get_gridfs_manager(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> GridFSManager:
    return GridFSManager(db=db)
