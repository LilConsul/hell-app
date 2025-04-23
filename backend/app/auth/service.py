from datetime import timedelta

from fastapi import Response

from app.auth.repository import UserRepository
from app.auth.schemas import UserCreate, UserLogin, UserResponse
from app.users.schemas import UserUpdate
from app.auth.security import (
    create_access_token,
    create_verification_token,
    decode_verification_token,
    get_password_hash,
    verify_password,
)
from app.core.exceptions import AuthenticationError, BadRequestError, NotFoundError
from app.settings import settings


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def register(self, user_data: UserCreate) -> None:
        existing_user = await self.user_repository.get_by_email(user_data.email)
        if existing_user:
            raise BadRequestError(f"User with email {user_data.email} already exists")

        hashed_password = get_password_hash(user_data.password)
        user_dict = {
            "email": user_data.email,
            "hashed_password": hashed_password,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
        }
        await self.user_repository.create(user_dict)

    async def login(self, login_data: UserLogin, response: Response) -> UserResponse:
        user = await self.user_repository.get_by_email(login_data.email)
        if not user:
            raise AuthenticationError("Invalid username or password")

        if not verify_password(login_data.password, user.hashed_password):
            raise AuthenticationError("Invalid username or password")

        if not user.is_verified:
            raise AuthenticationError(
                "Email not verified. Please verify your email first."
            )

        access_token_expires = timedelta(seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS)
        access_token = create_access_token(
            subject=user.id, role=user.role, expires_delta=access_token_expires
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
            domain=settings.DOMAIN,
        )

        return UserResponse.model_validate(user)

    async def logout(self, response: Response) -> None:
        response.delete_cookie(
            key="access_token",
            httponly=True,
            secure=settings.COOKIE_SECURE,
            domain=settings.COOKIE_DOMAIN,
        )

    # Email verification methods
    async def send_verification_token(self, email: str) -> None:
        user = await self.user_repository.get_by_email(email)
        if not user:
            raise BadRequestError(f"No user found with email {email}")

        verification_token = create_verification_token(
            user_id=user.id, token_type="verification"
        )

        # In a real app, you'd send this via email with a URL like:
        # verification_url = f"{settings.frontend_url}/verify?token={verification_token}"
        # But we'll just print it to console for this example
        print(f"Verification token for user {email}: {verification_token}")
        print(f"Verification URL would be: /auth/verify?token={verification_token}")

    async def verify_token(self, token: str) -> None:
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
            raise AuthenticationError("User is already verified")

        # Mark user as verified
        user.is_verified = True
        await self.user_repository.save(user)

    async def send_password_reset_token(self, email: str) -> None:
        user = await self.user_repository.get_by_email(email)
        if not user:
            raise BadRequestError(f"No user found with email {email}")

        password_reset_token = create_verification_token(
            user_id=user.id, token_type="password_reset"
        )

        # In a real app, you'd send this via email with a URL like:
        # password_reset_url = f"{settings.frontend_url}/reset-password?token={password_reset_token}"
        # But we'll just print it to console for this example
        print(f"Password reset token for user {email}: {password_reset_token}")
        print(
            f"Password reset URL would be: /auth/reset-password?token={password_reset_token}"
        )

    async def reset_password(self, token: str, new_password: str) -> None:
        token_data = decode_verification_token(token)
        if not token_data:
            raise AuthenticationError("Invalid or expired password reset token")

        user_id = token_data.get("user_id")
        token_type = token_data.get("type")

        if token_type != "password_reset":
            raise AuthenticationError("Invalid token type")

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        # Update user's password
        hashed_password = get_password_hash(new_password)
        user.hashed_password = hashed_password
        await self.user_repository.save(user)

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

        update_data = {}
        if user_data.first_name is not None:
            update_data["first_name"] = user_data.first_name
        if user_data.last_name is not None:
            update_data["last_name"] = user_data.last_name

        updated_user = await self.user_repository.update(user_id, update_data)
        return UserResponse.model_validate(updated_user)

    async def delete_user_info(self, user_id: str) -> None:
        success = await self.user_repository.delete(user_id)
        if not success:
            raise NotFoundError("User not found")

    async def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> None:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not verify_password(old_password, user.hashed_password):
            raise AuthenticationError("Invalid password")

        await self.user_repository.update(
            user_id, {"hashed_password": get_password_hash(new_password)}
        )
