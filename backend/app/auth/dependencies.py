from fastapi import Depends

from app.auth.infrastructure import CookieTokenAuth
from app.auth.models import User, UserRole
from app.auth.repository import UserRepository
from app.auth.security import decode_token
from app.auth.service import AuthService
from app.core.exceptions import AuthenticationError, ForbiddenError
from app.i18n import _


# Repositories
def get_user_repository() -> UserRepository:
    return UserRepository(User)


# Services
def get_auth_service(
    user_repository: UserRepository = Depends(get_user_repository),
) -> AuthService:
    return AuthService(user_repository=user_repository)


# Authentication infrastructure
cookie_token_auth = CookieTokenAuth(
    token_url="/auth/login",
    cookie_name="access_token",
    description="HTTP-only cookie or Bearer token authentication",
)


async def get_auth_token(
    token: str = Depends(cookie_token_auth),
) -> str:
    """Get the authentication token from the request"""
    if not token:
        raise AuthenticationError(_("Not authenticated"))
    return token


async def get_decode_token(token: str = Depends(get_auth_token)) -> dict:
    """Decode the authentication token"""
    token_data = decode_token(token)
    if not token_data:
        raise AuthenticationError(_("Invalid token"))
    return token_data


# Token validation dependencies
async def get_current_user_id(
    token_data: dict = Depends(get_decode_token),
) -> str:
    if not token_data.get("sub"):
        raise AuthenticationError(_("Invalid token"))
    return token_data.get("sub")


async def get_current_student_id(
    token_data: dict = Depends(get_decode_token),
) -> str:
    if not token_data.get("sub"):
        raise AuthenticationError(_("Invalid token"))
    if (
        token_data.get("role") != UserRole.STUDENT
        and token_data.get("role") != UserRole.ADMIN
    ):
        raise ForbiddenError(_("Only students can access this resource"))
    return token_data.get("sub")


async def get_current_teacher_id(
    token_data: dict = Depends(get_decode_token),
) -> str:
    if not token_data.get("sub"):
        raise AuthenticationError(_("Invalid token"))
    if (
        token_data.get("role") != UserRole.TEACHER
        and token_data.get("role") != UserRole.ADMIN
    ):
        raise ForbiddenError(_("Only teachers can access this resource"))
    return token_data.get("sub")


async def get_current_admin_id(
    token_data: dict = Depends(get_decode_token),
) -> str:
    if not token_data.get("sub"):
        raise AuthenticationError(_("Invalid token"))
    if not token_data.get("role") == UserRole.ADMIN:
        raise ForbiddenError(_("Only admins can access this resource"))
    return token_data.get("sub")
