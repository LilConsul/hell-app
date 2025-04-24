from datetime import timedelta

from app.auth.repository import UserRepository
from app.auth.schemas import UserCreate, UserLogin, UserResponse
from app.auth.security import (
    create_access_token,
    create_verification_token,
    decode_verification_token,
    get_password_hash,
    verify_password,
)
from app.celery.tasks.email_tasks.tasks import (
    user_password_reset_mail,
    user_welcome_mail_event,
    user_verify_mail_event,
)
from app.core.exceptions import AuthenticationError, BadRequestError, NotFoundError
from app.settings import settings
from fastapi import Response


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

        user = await self.user_repository.create(user_dict)

        verification_token = create_verification_token(
            user_id=user.id, token_type="verification"
        )
        username = (
            user.first_name + " " + user.last_name
            if user.first_name and user.last_name
            else user.email
        )
        link = f"{settings.VERIFY_MAIL_URL}/{verification_token}"
        user_verify_mail_event.delay(user_data.email, link, username)

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

        username = (
            user.first_name + " " + user.last_name
            if user.first_name and user.last_name
            else user.email
        )
        date_registered = user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        user_welcome_mail_event.delay(user.email, username, date_registered)

    async def send_password_reset_token(self, email: str) -> None:
        user = await self.user_repository.get_by_email(email)
        if not user:
            raise BadRequestError(f"No user found with email {email}")

        password_reset_token = create_verification_token(
            user_id=user.id, token_type="password_reset"
        )

        link = settings.PASSWORD_RESET_URL
        link = link.format(token=password_reset_token)
        username = (
            user.first_name + " " + user.last_name
            if user.first_name and user.last_name
            else user.email
        )
        user_password_reset_mail.delay(
            user.email,
            link,
            username
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
