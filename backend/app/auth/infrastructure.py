from typing import Dict, Optional

import jwt
from app.core.exceptions import AuthenticationError
from app.settings import settings
from fastapi import HTTPException, Request, status
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from fastapi.security import OAuth2
from fastapi.security.utils import get_authorization_scheme_param


class CookieTokenAuth(OAuth2):
    """
    OAuth2 compatible token authentication from cookies.

    This can be used with any authentication scheme, including:
    - JWT tokens from username/password login
    - Third-party OAuth providers (Google, GitHub, etc.)
    """

    def __init__(
            self,
            token_url: str,
            cookie_name: str = "access_token",
            scheme_name: Optional[str] = None,
            scopes: Optional[Dict[str, str]] = None,
            description: Optional[str] = None,
            auto_error: bool = True,
    ):
        if not scopes:
            scopes = {}
        flows = OAuthFlowsModel(password={"tokenUrl": token_url, "scopes": scopes})
        self.cookie_name = cookie_name
        self.description = description
        super().__init__(flows=flows, scheme_name=scheme_name, auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[str]:
        # Try to get the token from an HTTP-only cookie first
        token = request.cookies.get(self.cookie_name)

        # If no cookie token, fall back to standard Authorization header
        # This makes the auth more flexible (works with cookies or headers)
        if not token:
            header_authorization = request.headers.get("Authorization")
            if header_authorization:
                scheme, token = get_authorization_scheme_param(header_authorization)
                if scheme.lower() != "bearer":
                    token = None

        if not token and self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return token


# Authentication token validator function
def validate_token(token: str) -> Optional[str]:
    """Validate JWT token and return user_id if valid"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        return user_id
    except jwt.PyJWTError:
        return None
