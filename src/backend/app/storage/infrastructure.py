import json
import logging
from functools import lru_cache

from minio import Minio
from minio.error import S3Error

from app.settings import settings

logger = logging.getLogger(__name__)


@lru_cache
def get_minio_client() -> Minio:
    """
    Get MinIO client instance (cached).

    Returns:
        Minio: Configured MinIO client
    """
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ROOT_USER,
        secret_key=settings.MINIO_ROOT_PASSWORD,
        secure=settings.MINIO_SECURE,
    )


async def ensure_bucket_exists() -> None:
    """
    Ensure the MinIO bucket exists, create if it doesn't.
    Also sets the bucket policy for public read access to avatars.
    """
    logger.info("Starting MinIO bucket initialization...")
    client = get_minio_client()
    bucket_name = settings.MINIO_BUCKET_NAME

    try:
        # Check if bucket exists
        logger.info(f"Checking if bucket {bucket_name} exists...")
        exists = client.bucket_exists(bucket_name)

        if not exists:
            logger.info(f"Creating bucket: {bucket_name}")
            client.make_bucket(bucket_name, location=settings.MINIO_REGION)
            logger.info(f"Bucket {bucket_name} created successfully")
        else:
            logger.info(f"Bucket {bucket_name} already exists")

        # Set bucket policy for public read access to avatars
        logger.info(f"Setting bucket policy for {bucket_name}...")
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/avatars/*"],
                }
            ],
        }

        client.set_bucket_policy(bucket_name, json.dumps(policy))
        logger.info(f"Bucket policy set successfully for {bucket_name}")

    except S3Error as e:
        logger.error(f"Error ensuring bucket exists: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in bucket initialization: {e}")
        raise


def get_object_url(object_name: str, expires_seconds: int = 3600) -> str:
    """
    Generate a public URL for an object.
    Since avatars are publicly readable, we return a direct URL through nginx.

    Args:
        object_name: The object path in MinIO
        expires_seconds: URL expiration time in seconds (not used for public URLs)

    Returns:
        str: Public URL accessible through nginx
    """
    # Return public URL through nginx proxy
    # Format: https://localhost/minio/bucket-name/object-path
    protocol = (
        "https" if settings.MINIO_SECURE else "https"
    )  # Always use https for external
    url = f"{protocol}://{settings.DOMAIN}/minio/{settings.MINIO_BUCKET_NAME}/{object_name}"
    return url
