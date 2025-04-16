from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from itsdangerous import URLSafeTimedSerializer

from app.settings import settings

# Create serializer for URL-safe tokens (for email verification)
serializer = URLSafeTimedSerializer(
    secret_key=settings.SECRET_KEY, salt="email_verification"
)


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


def create_verification_token(user_id: str, token_type: str) -> str:
    """Create URL-safe token for email verification"""
    data = {
        "user_id": user_id,
        "created": datetime.now(timezone.utc).timestamp(),
        "type": token_type,
    }
    return serializer.dumps(data)


def decode_verification_token(token: str, max_age=86400) -> Optional[Dict[str, Any]]:
    """Decode and validate verification token with expiry check"""
    try:
        data = serializer.loads(token, max_age=max_age)  # Default max_age is 24 hours
        return data
    except Exception:
        return None
