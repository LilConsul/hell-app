from app.auth.infrastructure import CookieTokenAuth, validate_token
from app.auth.oauth_service import OAuthService
from app.auth.repository import UserRepository
from app.auth.service import AuthService
from app.core.exceptions import AuthenticationError
from fastapi import Depends


# Repositories
def get_user_repository() -> UserRepository:
    return UserRepository()


# Services
def get_auth_service(
    user_repository: UserRepository = Depends(get_user_repository),
) -> AuthService:
    return AuthService(user_repository=user_repository)


def get_oauth_service(
    user_repository: UserRepository = Depends(get_user_repository),
) -> OAuthService:
    return OAuthService(user_repository=user_repository)


# Authentication infrastructure
cookie_token_auth = CookieTokenAuth(
    token_url="/auth/login",
    cookie_name="access_token",
    description="HTTP-only cookie or Bearer token authentication",
)


# Token validation dependencies
async def get_current_user_id(
    token: str = Depends(cookie_token_auth),
) -> str:
    user_id = validate_token(token)
    if not user_id:
        raise AuthenticationError("Invalid token")
    return user_id