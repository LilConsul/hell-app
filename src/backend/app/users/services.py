from typing import List, Optional

from fastapi import UploadFile

from app.auth.repository import UserRepository
from app.auth.schemas import UserResponse, UserRole
from app.auth.security import (
    TokenType,
    create_verification_token,
    decode_verification_token,
    delete_verification_token,
    get_password_hash,
    verify_password,
)
from app.celery.tasks.email_tasks.tasks import (
    user_deleted_notification,
    user_deletion_confirmation,
)
from app.core.exceptions import AuthenticationError, NotFoundError
from app.core.utils import make_username
from app.i18n import _
from app.settings import settings
from app.storage.service import StorageService
from app.users.schemas import StudentData, UserUpdate


class UserService:
    def __init__(
        self,
        user_repository: UserRepository,
        storage_service: Optional[StorageService] = None,
    ):
        self.user_repository = user_repository
        self.storage_service = storage_service or StorageService()

    async def get_all_students(self) -> List[StudentData]:
        """Get all students with profile picture URLs"""
        students = await self.user_repository.get_all_by_role(UserRole.STUDENT)
        if not students:
            return []

        result = []
        for student in students:
            student_data = StudentData.model_validate(student)
            student_data.profile_picture_url = (
                self.storage_service.get_profile_picture_url(
                    student.id,
                    student.profile_picture_id,
                    student.first_name,
                    student.last_name,
                )
            )
            result.append(student_data)

        return result

    async def get_user_info(self, user_id: str) -> UserResponse:
        """Get user information with profile picture URL"""
        user = await self.user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundError(_("User not found"))

        response = UserResponse.model_validate(user)

        # Add profile picture URL
        response.profile_picture_url = self.storage_service.get_profile_picture_url(
            user_id, user.profile_picture_id, user.first_name, user.last_name
        )

        return response

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

    async def upload_profile_picture(
        self, user_id: str, file: UploadFile
    ) -> UserResponse:
        """
        Upload user profile picture.

        Args:
            user_id: User ID
            file: Uploaded file

        Returns:
            UserResponse: Updated user data with profile picture URL
        """
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(_("User not found"))

        # Upload to MinIO
        extension, url = await self.storage_service.upload_profile_picture(
            user_id, file
        )

        # Update user record
        updated_user = await self.user_repository.update(
            user_id, {"profile_picture_id": extension}
        )

        response = UserResponse.model_validate(updated_user)
        response.profile_picture_url = url

        return response

    async def delete_profile_picture(self, user_id: str) -> UserResponse:
        """
        Delete user profile picture.

        Args:
            user_id: User ID

        Returns:
            UserResponse: Updated user data without profile picture
        """
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError(_("User not found"))

        # Delete from MinIO if exists
        if user.profile_picture_id:
            await self.storage_service.delete_profile_picture(
                user_id, user.profile_picture_id
            )

        # Update user record
        updated_user = await self.user_repository.update(
            user_id, {"profile_picture_id": None}
        )

        response = UserResponse.model_validate(updated_user)
        response.profile_picture_url = self.storage_service.get_default_avatar_url(
            user_id, user.first_name, user.last_name
        )

        return response
