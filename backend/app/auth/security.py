from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, Optional

import bcrypt
import jwt
from app.database.redis import get_redis_client
from app.settings import settings
from itsdangerous import URLSafeTimedSerializer

# Create serializer for URL-safe tokens (for email verification)
serializer = URLSafeTimedSerializer(
    secret_key=settings.SECRET_KEY, salt="email_verification"
)


class TokenType(str, Enum):
    """Enum for token types"""

    VERIFICATION = "verification"
    PASSWORD_RESET = "password_reset"
    USER_DELETION = "user_deletion"


def get_password_hash(password: str) -> str:
    """Generate a salt and hash the password"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if the plain password matches the hashed password"""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(
    subject: str, role: str, expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token for authentication"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_SECONDS
        )

    to_encode = {"exp": expire, "sub": subject, "role": role}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode JWT authentication token"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        return None


async def create_verification_token(
    user_id: str, token_type: TokenType, max_age=86400
) -> str:
    """Create URL-safe token for email verification and store in Redis"""
    data = {
        "user_id": user_id,
        "created": datetime.now(timezone.utc).timestamp(),
        "type": token_type.value,
    }
    token = serializer.dumps(data)

    # Store token in Redis with expiration
    redis_client = await get_redis_client()
    token_key = f"token:{token_type.value}:{token}"
    await redis_client.setex(token_key, max_age, user_id)

    return token


async def decode_verification_token(
    token: str, max_age=86400
) -> Optional[Dict[str, Any]]:
    """Decode and validate verification token with expiry check and Redis validation"""
    try:
        # First decode to get token type
        data = serializer.loads(token, max_age=max_age)
        token_type = data.get("type")

        # Check if token exists in Redis
        redis_client = await get_redis_client()
        token_key = f"token:{token_type}:{token}"
        if not await redis_client.exists(token_key):
            return None

        return data
    except Exception:
        return None


async def delete_verification_token(token: str) -> bool:
    """Delete token from Redis after successful verification"""
    try:
        # First decode to get token type
        data = serializer.loads(token)
        token_type = data.get("type")

        # Delete token from Redis
        redis_client = await get_redis_client()
        token_key = f"token:{token_type}:{token}"
        return bool(await redis_client.delete(token_key))
    except Exception:
        return False
