import io
import logging
from typing import Optional

from fastapi import UploadFile
from minio import Minio
from minio.error import S3Error

from app.core.exceptions import InternalServerError
from app.i18n import _
from app.settings import settings
from app.storage.infrastructure import get_minio_client, get_object_url
from app.storage.validators import validate_image_file

logger = logging.getLogger(__name__)


class StorageService:
    """Service for handling file storage operations with MinIO"""

    def __init__(self, minio_client: Optional[Minio] = None):
        self.client = minio_client or get_minio_client()
        self.bucket_name = settings.MINIO_BUCKET_NAME

    def _get_avatar_path(self, user_id: str, extension: str) -> str:
        """
        Generate avatar path in MinIO.

        Args:
            user_id: User ID
            extension: File extension (without dot)

        Returns:
            str: Object path in MinIO
        """
        return f"avatars/{user_id}.{extension}"

    async def upload_profile_picture(
        self, user_id: str, file: UploadFile
    ) -> tuple[str, str]:
        """
        Upload a profile picture to MinIO.

        Args:
            user_id: User ID
            file: The uploaded file

        Returns:
            tuple: (file_extension, presigned_url)

        Raises:
            FileValidationError: If file validation fails
            InternalServerError: If upload fails
        """
        # Validate file
        extension = await validate_image_file(file)

        # Delete old profile picture if exists
        await self._delete_user_avatars(user_id)

        # Prepare object path
        object_name = self._get_avatar_path(user_id, extension)

        try:
            # Read file contents
            contents = await file.read()
            file_size = len(contents)

            # Upload to MinIO
            self.client.put_object(
                self.bucket_name,
                object_name,
                data=io.BytesIO(contents),
                length=file_size,
                content_type=file.content_type,
            )

            logger.info(f"Profile picture uploaded: {object_name}")

            # Generate presigned URL
            url = get_object_url(object_name)

            return extension, url

        except S3Error as e:
            logger.error(f"Error uploading profile picture: {e}")
            raise InternalServerError(_("Failed to upload profile picture"))
        finally:
            await file.seek(0)

    async def delete_profile_picture(self, user_id: str, extension: str) -> None:
        """
        Delete a user's profile picture from MinIO.

        Args:
            user_id: User ID
            extension: File extension
        """
        object_name = self._get_avatar_path(user_id, extension)

        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"Profile picture deleted: {object_name}")
        except S3Error as e:
            logger.error(f"Error deleting profile picture: {e}")
            # Don't raise error if file doesn't exist
            if e.code != "NoSuchKey":
                raise

    async def _delete_user_avatars(self, user_id: str) -> None:
        """
        Delete all avatar files for a user (all extensions).

        Args:
            user_id: User ID
        """
        for ext in settings.ALLOWED_IMAGE_EXTENSIONS:
            try:
                object_name = self._get_avatar_path(user_id, ext)
                self.client.remove_object(self.bucket_name, object_name)
            except S3Error:
                # Ignore errors (file might not exist)
                pass

    def get_profile_picture_url(
        self,
        user_id: str,
        profile_picture_id: Optional[str],
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> str:
        """
        Get profile picture URL for a user.

        Args:
            user_id: User ID
            profile_picture_id: File extension stored in database
            first_name: User's first name (for default avatar initials)
            last_name: User's last name (for default avatar initials)

        Returns:
            str: Presigned URL or default avatar URL
        """
        if not profile_picture_id:
            return self.get_default_avatar_url(user_id, first_name, last_name)

        object_name = self._get_avatar_path(user_id, profile_picture_id)

        try:
            # Check if object exists
            self.client.stat_object(self.bucket_name, object_name)
            return get_object_url(object_name)
        except S3Error:
            # Return default if file doesn't exist
            return self.get_default_avatar_url(user_id, first_name, last_name)

    def get_default_avatar_url(
        self,
        user_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> str:
        """
        Get default avatar URL using UI Avatars service with user initials.

        Args:
            user_id: User ID (used to generate consistent color)
            first_name: User's first name
            last_name: User's last name

        Returns:
            str: Default avatar URL with initials and modern colors
        """
        # Generate initials from first_name and last_name
        initials = ""
        if first_name:
            initials += first_name[0].upper()
        if last_name:
            initials += last_name[0].upper()

        # Fallback to user_id if no names provided
        if not initials:
            initials = user_id[:2].upper()

        # Modern colors from shadcn/tailwind theme
        # Using vibrant, accessible colors that work well for avatars
        color_hash = abs(hash(user_id)) % 12
        colors = [
            "3b82f6",  # blue-500
            "8b5cf6",  # violet-500
            "ec4899",  # pink-500
            "f59e0b",  # amber-500
            "10b981",  # emerald-500
            "06b6d4",  # cyan-500
            "6366f1",  # indigo-500
            "ef4444",  # red-500
            "14b8a6",  # teal-500
            "f97316",  # orange-500
            "84cc16",  # lime-500
            "a855f7",  # purple-500
        ]
        background = colors[color_hash]

        # Use white text for better contrast on all backgrounds
        return f"https://ui-avatars.com/api/?name={initials}&background={background}&color=ffffff&size=200&bold=true"
