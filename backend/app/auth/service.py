from datetime import timedelta

from app.auth.exceptions import AuthenticationError, BadRequestError, NotFoundError
from app.auth.repository import UserRepository
from app.auth.schemas import UserCreate, UserLogin, UserResponse, UserUpdate
from app.auth.security import (
    create_access_token,
    create_verification_token,
    decode_verification_token,
    get_password_hash,
    verify_password,
)
from app.settings import settings
from fastapi import Response


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def register(self, user_data: UserCreate) -> UserResponse:
        existing_user = await self.user_repository.get_by_email(user_data.email)
        if existing_user:
            raise BadRequestError(f"User with email {user_data.email} already exists")

        hashed_password = get_password_hash(user_data.password)
        user = await self.user_repository.create(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
        )

        return UserResponse.model_validate(user)

    async def login(self, login_data: UserLogin, response: Response) -> dict:
        user = await self.user_repository.get_by_email(login_data.email)
        if not user:
            raise AuthenticationError("Invalid username or password")

        if not verify_password(login_data.password, user.hashed_password):
            raise AuthenticationError("Invalid username or password")

        if not user.is_verified:
            raise AuthenticationError(
                "Email not verified. Please verify your email first."
            )

        # Create access token and set as cookie
        access_token_expires = timedelta(seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS)
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )

        # Set cookie with httponly and secure flags
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
            domain=settings.DOMAIN,
        )

        return {"access_token": access_token, "token_type": "bearer"}

    async def logout(self, response: Response) -> dict:
        # Delete the cookie
        response.delete_cookie(
            key="access_token",
            httponly=True,
            secure=settings.COOKIE_SECURE,
            domain=settings.COOKIE_DOMAIN,
        )

        return {"message": "Successfully logged out"}

    # Email verification methods
    async def send_verification_token(self, email: str) -> dict:
        user = await self.user_repository.get_by_email(email)
        if not user:
            # Don't reveal that the user doesn't exist for security reasons
            return {
                "message": "If a user with this email exists, a verification token has been sent"
            }

        # Create verification token
        verification_token = create_verification_token(user_id=user.id)

        # In a real app, you'd send this via email with a URL like:
        # verification_url = f"{settings.frontend_url}/verify?token={verification_token}"
        # But we'll just print it to console for this example
        print(f"Verification token for user {email}: {verification_token}")
        print(f"Verification URL would be: /auth/verify?token={verification_token}")

        return {
            "message": "If a user with this email exists, a verification token has been sent"
        }

    async def verify_token(self, token: str) -> UserResponse:
        token_data = decode_verification_token(token)
        if not token_data:
            raise AuthenticationError("Invalid or expired verification token")

        user_id = token_data.get("user_id")
        token_type = token_data.get("type")

        if token_type != "verification":
            raise AuthenticationError("Invalid token type")

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        if user.is_verified:
            return UserResponse.model_validate(user)

        # Mark user as verified
        user = await self.user_repository.set_verified(user)

        return UserResponse.model_validate(user)

    # User methods
    async def get_user_info(self, user_id: str) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundError("User not found")

        return UserResponse.model_validate(user)

    async def update_user_info(
        self, user_id: str, user_data: UserUpdate
    ) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundError("User not found")

        if user_data.first_name is not None:
            user.first_name = user_data.first_name
        if user_data.last_name is not None:
            user.last_name = user_data.last_name

        updated_user = await self.user_repository.update_user(user)

        return UserResponse.model_validate(updated_user)

    async def delete_user_info(self, user_id: str) -> None:
        user = await self.user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundError("User not found")

        await self.user_repository.delete_user(user)

    async def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundError("User not found")
        if not verify_password(old_password, user.hashed_password):
            raise AuthenticationError("Invalid password")

        user.hashed_password = get_password_hash(new_password)

        updated_user = await self.user_repository.update_user(user)

        return UserResponse.model_validate(updated_user)
