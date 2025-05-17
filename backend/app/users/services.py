from typing import List

from app.auth.repository import UserRepository
from app.auth.schemas import UserResponse, UserRole
from app.auth.security import (TokenType, create_verification_token,
                               decode_verification_token,
                               delete_verification_token, get_password_hash,
                               verify_password)
from app.celery.tasks.email_tasks.tasks import (user_deleted_notification,
                                                user_deletion_confirmation)
from app.core.exceptions import AuthenticationError, NotFoundError
from app.core.utils import make_username
from app.i18n import _
from app.settings import settings
from app.users.schemas import StudentData, UserUpdate


class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def get_all_students(self) -> List[StudentData]:
        """Get all students"""
        students = await self.user_repository.get_all_by_role(UserRole.STUDENT)
        if not students:
            return []
        return [StudentData.model_validate(student) for student in students]

    async def get_user_info(self, user_id: str) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundError(_("User not found"))

        return UserResponse.model_validate(user)

    async def update_user_info(
        self, user_id: str, user_data: UserUpdate
    ) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(_("User not found"))

        update_data = {}
        if user_data.first_name is not None:
            update_data["first_name"] = user_data.first_name
        if user_data.last_name is not None:
            update_data["last_name"] = user_data.last_name

        updated_user = await self.user_repository.update(user_id, update_data)
        return UserResponse.model_validate(updated_user)

    async def request_delete_user_info(self, user_id: str) -> None:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(_("User not found"))

        user_deletion_token = await create_verification_token(
            user_id=user_id, token_type=TokenType.USER_DELETION
        )

        user_deletion_link = settings.DELETE_ACCOUNT_URL.format(
            token=user_deletion_token
        )

        user_deletion_confirmation.delay(
            recipient=user.email,
            link=user_deletion_link,
            date_registered=user.created_at,
            username=make_username(user),
        )

    async def delete_user_info(self, user_id: str, token: str) -> None:
        delete_data = await decode_verification_token(token)
        if not delete_data or not delete_data.get("type"):
            raise AuthenticationError(_("Invalid or expired token"))

        if delete_data.get("type") != TokenType.USER_DELETION.value:
            raise AuthenticationError(_("Invalid token type"))

        if delete_data.get("user_id") != user_id:
            raise AuthenticationError(_("Token does not match current user"))

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(_("User not found"))

        await self.user_repository.delete(user_id)
        user_deleted_notification.delay(
            recipient=user.email,
            date_registered=user.created_at,
            username=user.first_name + " " + user.last_name,
        )
        await delete_verification_token(token)

    async def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> None:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(_("User not found"))
        if not verify_password(old_password, user.hashed_password):
            raise AuthenticationError(_("Invalid password"))

        await self.user_repository.update(
            user_id, {"hashed_password": get_password_hash(new_password)}
        )
