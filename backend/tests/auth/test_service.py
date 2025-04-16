from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import Response

from app.auth.exceptions import AuthenticationError, BadRequestError, NotFoundError
from app.auth.models import User
from app.auth.schemas import UserCreate, UserLogin, UserUpdate
from app.auth.security import get_password_hash
from app.auth.service import AuthService


class TestAuthService:
    """Test suite for the AuthService class"""

    @pytest.fixture
    def mock_user_repository(self):
        """Create a mock UserRepository with async methods"""
        mock = MagicMock()
        # Make all repository methods return awaitable objects
        mock.get_by_email = AsyncMock()
        mock.get_by_id = AsyncMock()
        mock.create = AsyncMock()
        mock.update = AsyncMock()
        mock.delete = AsyncMock()
        mock.save = AsyncMock()
        return mock

    @pytest.fixture
    def auth_service(self, mock_user_repository):
        """Create AuthService with mock repository"""
        return AuthService(user_repository=mock_user_repository)

    @pytest.fixture
    def test_user(self, fake):
        """Create a test user object"""
        return User(
            id="test-user-id",
            email=fake.email(),
            hashed_password=get_password_hash("password123"),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            is_verified=True,
            role="student",
        )

    @pytest.fixture
    def unverified_user(self, fake):
        """Create an unverified test user"""
        return User(
            id="unverified-user-id",
            email=fake.email(),
            hashed_password=get_password_hash("password123"),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            is_verified=False,
            role="student",
        )

    # Register tests
    async def test_register_success(self, auth_service, mock_user_repository, fake):
        # Setup
        mock_user_repository.get_by_email.return_value = None
        user_data = UserCreate(
            email=fake.email(),
            password="Password123!",
            first_name=fake.first_name(),
            last_name=fake.last_name(),
        )

        # Execute
        await auth_service.register(user_data)

        # Verify
        mock_user_repository.get_by_email.assert_called_once_with(user_data.email)
        mock_user_repository.create.assert_called_once()
        # Update to check first positional argument instead of keyword args
        created_data = mock_user_repository.create.call_args[0][0]
        assert created_data["email"] == user_data.email
        assert created_data["first_name"] == user_data.first_name
        assert created_data["last_name"] == user_data.last_name

    async def test_register_duplicate_email(
        self, auth_service, mock_user_repository, test_user, fake
    ):
        # Setup
        mock_user_repository.get_by_email.return_value = test_user
        user_data = UserCreate(
            email=test_user.email,
            password="Password123!",
            first_name=fake.first_name(),
            last_name=fake.last_name(),
        )

        # Execute and verify exception
        with pytest.raises(BadRequestError) as exc_info:
            await auth_service.register(user_data)

        assert f"User with email {test_user.email} already exists" in str(
            exc_info.value
        )
        mock_user_repository.create.assert_not_called()

    # Login tests
    async def test_login_success(self, auth_service, mock_user_repository, test_user):
        # Setup
        mock_user_repository.get_by_email.return_value = test_user
        login_data = UserLogin(email=test_user.email, password="password123")
        mock_response = MagicMock(spec=Response)

        # Execute
        with patch("app.auth.service.verify_password", return_value=True):
            with patch(
                "app.auth.service.create_access_token", return_value="test_token"
            ):
                result = await auth_service.login(login_data, mock_response)

        # Verify
        assert result is not None
        assert result.email == test_user.email
        assert result.id == test_user.id
        mock_response.set_cookie.assert_called_once()
        assert mock_response.set_cookie.call_args[1]["key"] == "access_token"
        assert mock_response.set_cookie.call_args[1]["value"] == "test_token"

    async def test_login_user_not_found(self, auth_service, mock_user_repository):
        # Setup
        mock_user_repository.get_by_email.return_value = None
        login_data = UserLogin(email="nonexistent@example.com", password="password123")
        mock_response = MagicMock(spec=Response)

        # Execute and verify exception
        with pytest.raises(AuthenticationError) as exc_info:
            await auth_service.login(login_data, mock_response)

        assert "Invalid username or password" in str(exc_info.value)
        mock_response.set_cookie.assert_not_called()

    async def test_login_wrong_password(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup
        mock_user_repository.get_by_email.return_value = test_user
        login_data = UserLogin(email=test_user.email, password="wrong_password")
        mock_response = MagicMock(spec=Response)

        # Execute and verify exception
        with patch("app.auth.service.verify_password", return_value=False):
            with pytest.raises(AuthenticationError) as exc_info:
                await auth_service.login(login_data, mock_response)

        assert "Invalid username or password" in str(exc_info.value)
        mock_response.set_cookie.assert_not_called()

    async def test_login_unverified_user(
        self, auth_service, mock_user_repository, unverified_user
    ):
        # Setup
        mock_user_repository.get_by_email.return_value = unverified_user
        login_data = UserLogin(email=unverified_user.email, password="password123")
        mock_response = MagicMock(spec=Response)

        # Execute and verify exception
        with patch("app.auth.service.verify_password", return_value=True):
            with pytest.raises(AuthenticationError) as exc_info:
                await auth_service.login(login_data, mock_response)

        assert "Email not verified" in str(exc_info.value)
        mock_response.set_cookie.assert_not_called()

    # Logout test
    async def test_logout(self, auth_service):
        # Setup
        mock_response = MagicMock(spec=Response)

        # Execute
        with patch("app.auth.service.settings.COOKIE_SECURE", False):
            await auth_service.logout(mock_response)

        # Verify
        mock_response.delete_cookie.assert_called_once_with(
            key="access_token",
            httponly=True,
            secure=False,
            domain=None,
        )

    # Verification token tests
    async def test_verify_token_success(
        self, auth_service, mock_user_repository, unverified_user
    ):
        # Setup
        token = "valid_token"
        token_data = {"user_id": unverified_user.id, "type": "verification"}
        mock_user_repository.get_by_id.return_value = unverified_user

        # Execute
        with patch(
            "app.auth.service.decode_verification_token", return_value=token_data
        ):
            await auth_service.verify_token(token)

        # Verify
        mock_user_repository.get_by_id.assert_called_once_with(unverified_user.id)
        assert unverified_user.is_verified is True
        mock_user_repository.save.assert_called_once_with(unverified_user)

    async def test_send_verification_token_user_not_found(
        self, auth_service, mock_user_repository
    ):
        # Setup
        mock_user_repository.get_by_email.return_value = None
        email = "nonexistent@example.com"

        # Execute and verify exception
        with pytest.raises(BadRequestError) as exc_info:
            await auth_service.send_verification_token(email)

        assert f"No user found with email {email}" in str(exc_info.value)

    async def test_verify_token_invalid(self, auth_service):
        # Setup
        token = "invalid_token"

        # Execute and verify exception
        with patch("app.auth.service.decode_verification_token", return_value=None):
            with pytest.raises(AuthenticationError) as exc_info:
                await auth_service.verify_token(token)

        assert "Invalid or expired verification token" in str(exc_info.value)

    async def test_verify_token_wrong_type(self, auth_service):
        # Setup
        token = "wrong_type_token"
        token_data = {
            "user_id": "some_user_id",
            "type": "password_reset",  # Wrong type
        }

        # Execute and verify exception
        with patch(
            "app.auth.service.decode_verification_token", return_value=token_data
        ):
            with pytest.raises(AuthenticationError) as exc_info:
                await auth_service.verify_token(token)

        assert "Invalid token type" in str(exc_info.value)

    async def test_verify_token_user_not_found(
        self, auth_service, mock_user_repository
    ):
        # Setup
        token = "user_not_found_token"
        token_data = {"user_id": "non_existent_id", "type": "verification"}
        mock_user_repository.get_by_id.return_value = None

        # Execute and verify exception
        with patch(
            "app.auth.service.decode_verification_token", return_value=token_data
        ):
            with pytest.raises(NotFoundError) as exc_info:
                await auth_service.verify_token(token)

        assert "User not found" in str(exc_info.value)

    async def test_verify_token_already_verified(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup - test_user is already verified
        token = "already_verified_token"
        token_data = {"user_id": test_user.id, "type": "verification"}
        mock_user_repository.get_by_id.return_value = test_user

        # Execute and verify exception
        with patch(
            "app.auth.service.decode_verification_token", return_value=token_data
        ):
            with pytest.raises(AuthenticationError) as exc_info:
                await auth_service.verify_token(token)

        assert "User is already verified" in str(exc_info.value)
        mock_user_repository.set_verified.assert_not_called()

    # Password reset tests
    async def test_send_password_reset_token_success(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup
        mock_user_repository.get_by_email.return_value = test_user
        email = test_user.email

        # Execute
        with patch(
            "app.auth.service.create_verification_token", return_value="test_token"
        ):
            await auth_service.send_password_reset_token(email)

        # Verify
        mock_user_repository.get_by_email.assert_called_once_with(email)

    async def test_send_password_reset_token_user_not_found(
        self, auth_service, mock_user_repository
    ):
        # Setup
        mock_user_repository.get_by_email.return_value = None
        email = "nonexistent@example.com"

        # Execute and verify exception
        with pytest.raises(BadRequestError) as exc_info:
            await auth_service.send_password_reset_token(email)

        assert f"No user found with email {email}" in str(exc_info.value)

    async def test_reset_password_success(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup
        token = "valid_token"
        new_password = "NewPassword123!"
        token_data = {"user_id": test_user.id, "type": "password_reset"}
        mock_user_repository.get_by_id.return_value = test_user

        # Execute
        with patch(
            "app.auth.service.decode_verification_token", return_value=token_data
        ):
            with patch(
                "app.auth.service.get_password_hash", return_value="new_hashed_password"
            ):
                await auth_service.reset_password(token, new_password)

        # Verify
        mock_user_repository.get_by_id.assert_called_once_with(test_user.id)
        mock_user_repository.save.assert_called_once_with(test_user)
        assert test_user.hashed_password == "new_hashed_password"

    async def test_reset_password_invalid_token(self, auth_service):
        # Setup
        token = "invalid_token"
        new_password = "NewPassword123!"

        # Execute and verify exception
        with patch("app.auth.service.decode_verification_token", return_value=None):
            with pytest.raises(AuthenticationError) as exc_info:
                await auth_service.reset_password(token, new_password)

        assert "Invalid or expired password reset token" in str(exc_info.value)

    async def test_reset_password_wrong_token_type(self, auth_service):
        # Setup
        token = "wrong_type_token"
        new_password = "NewPassword123!"
        token_data = {
            "user_id": "some_user_id",
            "type": "verification",  # Wrong type
        }

        # Execute and verify exception
        with patch(
            "app.auth.service.decode_verification_token", return_value=token_data
        ):
            with pytest.raises(AuthenticationError) as exc_info:
                await auth_service.reset_password(token, new_password)

        assert "Invalid token type" in str(exc_info.value)

    async def test_reset_password_user_not_found(
        self, auth_service, mock_user_repository
    ):
        # Setup
        token = "user_not_found_token"
        new_password = "NewPassword123!"
        token_data = {"user_id": "non_existent_id", "type": "password_reset"}
        mock_user_repository.get_by_id.return_value = None

        # Execute and verify exception
        with patch(
            "app.auth.service.decode_verification_token", return_value=token_data
        ):
            with pytest.raises(NotFoundError) as exc_info:
                await auth_service.reset_password(token, new_password)

        assert "User not found" in str(exc_info.value)

    # User info tests
    async def test_get_user_info_success(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup
        mock_user_repository.get_by_id.return_value = test_user
        user_id = test_user.id

        # Execute
        result = await auth_service.get_user_info(user_id)

        # Verify
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        assert result.id == test_user.id
        assert result.email == test_user.email
        assert result.first_name == test_user.first_name
        assert result.last_name == test_user.last_name

    async def test_get_user_info_not_found(self, auth_service, mock_user_repository):
        # Setup
        mock_user_repository.get_by_id.return_value = None
        user_id = "non_existent_id"

        # Execute and verify exception
        with pytest.raises(NotFoundError) as exc_info:
            await auth_service.get_user_info(user_id)

        assert "User not found" in str(exc_info.value)

    async def test_update_user_info_success(
        self, auth_service, mock_user_repository, test_user, fake
    ):
        # Setup
        mock_user_repository.get_by_id.return_value = test_user
        user_id = test_user.id
        new_first_name = fake.first_name()
        new_last_name = fake.last_name()
        user_data = UserUpdate(first_name=new_first_name, last_name=new_last_name)

        # Create a proper updated user for the mock return value
        updated_user = User(
            id=test_user.id,
            email=test_user.email,
            first_name=new_first_name,
            last_name=new_last_name,
            hashed_password=test_user.hashed_password,
            is_verified=test_user.is_verified,
            role=test_user.role,
        )
        mock_user_repository.update.return_value = updated_user

        # Execute
        result = await auth_service.update_user_info(user_id, user_data)

        # Verify
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        mock_user_repository.update.assert_called_once()
        assert mock_user_repository.update.call_args[0][0] == user_id
        update_data = mock_user_repository.update.call_args[0][1]
        assert update_data["first_name"] == new_first_name
        assert update_data["last_name"] == new_last_name
        assert result.first_name == new_first_name
        assert result.last_name == new_last_name

    async def test_update_user_info_not_found(
        self, auth_service, mock_user_repository, fake
    ):
        # Setup
        mock_user_repository.get_by_id.return_value = None
        user_id = "non_existent_id"
        user_data = UserUpdate(first_name=fake.first_name(), last_name=fake.last_name())

        # Execute and verify exception
        with pytest.raises(NotFoundError) as exc_info:
            await auth_service.update_user_info(user_id, user_data)

        assert "User not found" in str(exc_info.value)
        mock_user_repository.update_user.assert_not_called()

    async def test_delete_user_info_success(self, auth_service, mock_user_repository):
        # Setup
        user_id = "test-user-id"
        mock_user_repository.delete.return_value = True

        # Execute
        await auth_service.delete_user_info(user_id)

        # Verify
        mock_user_repository.delete.assert_called_once_with(user_id)

    async def test_delete_user_info_not_found(self, auth_service, mock_user_repository):
        # Setup
        user_id = "non-existent-id"
        mock_user_repository.delete.return_value = False

        # Execute and verify exception
        with pytest.raises(NotFoundError) as exc_info:
            await auth_service.delete_user_info(user_id)

        assert "User not found" in str(exc_info.value)
        mock_user_repository.delete.assert_called_once_with(user_id)

    async def test_change_password_success(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup
        mock_user_repository.get_by_id.return_value = test_user
        user_id = test_user.id
        old_password = "password123"
        new_password = "NewPassword123!"
        hashed_password = "new_hashed_password"

        # Execute
        with patch("app.auth.service.verify_password", return_value=True):
            with patch(
                "app.auth.service.get_password_hash", return_value=hashed_password
            ):
                await auth_service.change_password(user_id, old_password, new_password)

        # Verify
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        mock_user_repository.update.assert_called_once_with(
            user_id, {"hashed_password": hashed_password}
        )

    async def test_change_password_user_not_found(
        self, auth_service, mock_user_repository
    ):
        # Setup
        mock_user_repository.get_by_id.return_value = None
        user_id = "non_existent_id"
        old_password = "password123"
        new_password = "NewPassword123!"

        # Execute and verify exception
        with pytest.raises(NotFoundError) as exc_info:
            await auth_service.change_password(user_id, old_password, new_password)

        assert "User not found" in str(exc_info.value)
        mock_user_repository.update_user.assert_not_called()

    async def test_change_password_wrong_password(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup
        mock_user_repository.get_by_id.return_value = test_user
        user_id = test_user.id
        wrong_password = "wrong_password"
        new_password = "NewPassword123!"

        # Execute and verify exception
        with patch("app.auth.service.verify_password", return_value=False):
            with pytest.raises(AuthenticationError) as exc_info:
                await auth_service.change_password(
                    user_id, wrong_password, new_password
                )

        assert "Invalid password" in str(exc_info.value)
        # Password should not be changed
        assert test_user.hashed_password != "new_hashed_password"
        mock_user_repository.update_user.assert_not_called()
