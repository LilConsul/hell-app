import logging
from typing import List

import magic
from fastapi import HTTPException, UploadFile, status

from app.i18n import _
from app.settings import settings

logger = logging.getLogger(__name__)


class FileValidationError(HTTPException):
    """Custom exception for file validation errors"""

    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


async def validate_file_size(file: UploadFile, max_size_mb: int) -> None:
    """
    Validate file size.

    Args:
        file: The uploaded file
        max_size_mb: Maximum allowed size in megabytes

    Raises:
        FileValidationError: If file is too large
    """
    # Read file to get size
    contents = await file.read()
    file_size = len(contents)

    # Reset file pointer
    await file.seek(0)

    max_size_bytes = max_size_mb * 1024 * 1024

    if file_size > max_size_bytes:
        raise FileValidationError(
            _("File size exceeds maximum allowed size of {max_size}MB").format(
                max_size=max_size_mb
            )
        )

    logger.info(f"File size validation passed: {file_size} bytes")


def validate_file_extension(filename: str, allowed_extensions: List[str]) -> str:
    """
    Validate file extension and return it.

    Args:
        filename: The filename to validate
        allowed_extensions: List of allowed extensions (without dots)

    Returns:
        str: The file extension (without dot)

    Raises:
        FileValidationError: If extension is not allowed
    """
    if not filename or "." not in filename:
        raise FileValidationError(_("Invalid filename"))

    extension = filename.rsplit(".", 1)[1].lower()

    if extension not in allowed_extensions:
        raise FileValidationError(
            _("File type not allowed. Allowed types: {types}").format(
                types=", ".join(allowed_extensions)
            )
        )

    return extension


async def validate_mime_type(file: UploadFile, allowed_types: List[str]) -> None:
    """
    Validate file MIME type using python-magic.

    Args:
        file: The uploaded file
        allowed_types: List of allowed MIME types

    Raises:
        FileValidationError: If MIME type is not allowed
    """
    # Read first 2048 bytes for MIME detection
    contents = await file.read(2048)
    await file.seek(0)

    mime = magic.from_buffer(contents, mime=True)

    if mime not in allowed_types:
        raise FileValidationError(
            _("Invalid file type. Detected: {mime}").format(mime=mime)
        )

    logger.info(f"MIME type validation passed: {mime}")


async def validate_image_file(file: UploadFile) -> str:
    """
    Perform complete validation for image files.

    Args:
        file: The uploaded file

    Returns:
        str: The validated file extension

    Raises:
        FileValidationError: If validation fails
    """
    # Validate file size
    await validate_file_size(file, settings.MAX_PROFILE_PICTURE_SIZE_MB)

    # Validate extension
    extension = validate_file_extension(
        file.filename, settings.ALLOWED_IMAGE_EXTENSIONS
    )

    # Validate MIME type
    await validate_mime_type(file, settings.ALLOWED_MIME_TYPES)

    return extension
