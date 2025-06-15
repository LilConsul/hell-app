from datetime import timedelta

from app.auth.repository import UserRepository
from app.auth.schemas import UserCreate, UserLogin, UserResponse, UserRole
from app.auth.security import (
    TokenType,
    create_access_token,
    create_verification_token,
    decode_verification_token,
    delete_verification_token,
    get_password_hash,
    verify_password,
)
from app.celery.tasks.email_tasks.tasks import (
    user_password_reset_mail,
    user_verify_mail_event,
    user_welcome_mail_event,
)
from app.core.exceptions import AuthenticationError, BadRequestError, NotFoundError
from app.core.utils import make_username
from app.i18n import _
from app.settings import settings
from fastapi import Response


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def register(self, user_data: UserCreate) -> None:
        existing_user = await self.user_repository.get_by_email(user_data.email)
        if existing_user:
            raise BadRequestError(
                _("User with email {email} already exists").format(
                    email=user_data.email
                )
            )

        hashed_password = get_password_hash(user_data.password)
        user_dict = {
            "email": user_data.email,
            "hashed_password": hashed_password,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
        }

        user = await self.user_repository.create(user_dict)

        verification_token = await create_verification_token(
            user_id=user.id, token_type=TokenType.VERIFICATION, use_redis=False
        )
        link = f"{settings.VERIFY_MAIL_URL}/{verification_token}"
        user_verify_mail_event.delay(user_data.email, link, make_username(user))

    async def login(self, login_data: UserLogin, response: Response) -> UserResponse:
        user = await self.user_repository.get_by_email(login_data.email)
        if not user:
            raise AuthenticationError(_("Invalid username or password"))

        if not verify_password(login_data.password, user.hashed_password):
            raise AuthenticationError(_("Invalid username or password"))

        if not user.is_verified:
            raise AuthenticationError(
                _("Email not verified. Please verify your email first.")
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
        token_data = await decode_verification_token(token, use_redis=False)
        if not token_data:
            raise AuthenticationError(_("Invalid or expired verification token"))

        user_id = token_data.get("user_id")
        token_type = token_data.get("type")

        if token_type != TokenType.VERIFICATION.value:
            raise AuthenticationError(_("Invalid token type"))

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(_("User not found"))

        if user.is_verified:
            raise AuthenticationError(_("User is already verified"))

        # Mark user as verified
        user.is_verified = True
        await self.user_repository.save(user)

        date_registered = user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        user_welcome_mail_event.delay(user.email, date_registered, make_username(user))

    async def send_password_reset_token(self, email: str) -> None:
        user = await self.user_repository.get_by_email(email)
        if not user:
            raise BadRequestError(
                _("No user found with email {email}").format(email=email)
            )

        password_reset_token = await create_verification_token(
            user_id=user.id, token_type=TokenType.PASSWORD_RESET
        )

        link = settings.PASSWORD_RESET_URL
        link = link.format(token=password_reset_token)
        user_password_reset_mail.delay(
            user.email,
            link,
            make_username(user),
        )

    async def reset_password(self, token: str, new_password: str) -> None:
        token_data = await decode_verification_token(token)
        if not token_data:
            raise AuthenticationError(_("Invalid or expired password reset token"))

        user_id = token_data.get("user_id")
        token_type = token_data.get("type")

        if token_type != TokenType.PASSWORD_RESET.value:
            raise AuthenticationError(_("Invalid token type"))

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(_("User not found"))

        # Update user's password
        hashed_password = get_password_hash(new_password)
        user.hashed_password = hashed_password
        await self.user_repository.save(user)

        await delete_verification_token(token)

    async def initialize_user(
        self,
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = "",
        role: UserRole | None = None,
        is_verified: bool = True,
    ) -> None:
        """
        Initialize a user with the provided arguments if it doesn't exist.
        """
        existing_user = await self.user_repository.get_by_email(email)
        if existing_user:
            return

        hashed_password = get_password_hash(password)
        user_data = {
            "email": email,
            "hashed_password": hashed_password,
            "first_name": first_name or email,
            "last_name": last_name or "",
            "role": role or UserRole.STUDENT,
            "is_verified": is_verified,
        }

        await self.user_repository.create(user_data)

    async def initialize_test_users(self) -> None:
        """
        Initialize test users if they don't exist.
        """
        if settings.STUDENT_EMAIL and settings.STUDENT_PASSWORD:
            await self.initialize_user(
                email=settings.STUDENT_EMAIL,
                password=settings.STUDENT_PASSWORD,
                first_name="Test",
                last_name="Student",
                role=UserRole.STUDENT,
            )

        if settings.TEACHER_EMAIL and settings.TEACHER_PASSWORD:
            await self.initialize_user(
                email=settings.TEACHER_EMAIL,
                password=settings.TEACHER_PASSWORD,
                first_name="Test",
                last_name="Teacher",
                role=UserRole.TEACHER,
            )

        await self.initialize_user(
            email=settings.ADMIN_EMAIL,
            password=settings.ADMIN_PASSWORD,
            first_name="Super",
            last_name="Admin",
            role=UserRole.ADMIN,
        )
