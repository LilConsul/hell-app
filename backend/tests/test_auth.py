from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from app.auth.exceptions import AuthenticationError, BadRequestError, NotFoundError
from app.auth.models import User
from app.auth.repository import UserRepository
from app.auth.schemas import UserCreate, UserLogin, UserUpdate
from app.auth.security import get_password_hash
from app.auth.service import AuthService
from app.settings import settings
from fastapi import Response


class TestUserRepository:
    """Test suite for the UserRepository class"""

    async def test_create_user(self, fake):
        # Setup test data
        email = fake.email()
        password = "TestPassword123!"
        first_name = fake.first_name()
        last_name = fake.last_name()
        hashed_password = get_password_hash(password)

        # Execute create method
        repo = UserRepository()
        user = await repo.create(
            {
                "email": email,
                "hashed_password": hashed_password,
                "first_name": first_name,
                "last_name": last_name,
            }
        )

        # Verify user was created correctly
        assert user is not None
        assert user.email == email
        assert user.hashed_password == hashed_password
        assert user.first_name == first_name
        assert user.last_name == last_name
        assert user.is_verified is False
        assert user.role == "student"

        # Verify user exists in database
        db_user = await User.find_one(User.email == email)
        assert db_user is not None
        assert db_user.id == user.id

        # Clean up
        await user.delete()

    async def test_get_by_id(self, fake):
        # Create a test user
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        repo = UserRepository()
        user = await repo.create(
            {
                "email": email,
                "hashed_password": hashed_password,
            }
        )
        user_id = user.id

        # Test get_by_id method
        fetched_user = await repo.get_by_id(user_id)

        # Verify correct user was retrieved
        assert fetched_user is not None
        assert fetched_user.id == user_id
        assert fetched_user.email == email

        # Test with non-existent ID
        non_existent = await repo.get_by_id("non-existent-id")
        assert non_existent is None

        # Clean up
        await user.delete()

    async def test_get_by_email(self, fake):
        # Create a test user
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        repo = UserRepository()
        user = await repo.create(
            {
                "email": email,
                "hashed_password": hashed_password,
            }
        )

        # Test get_by_email method
        fetched_user = await repo.get_by_email(email)

        # Verify correct user was retrieved
        assert fetched_user is not None
        assert fetched_user.id == user.id
        assert fetched_user.email == email

        # Test with non-existent email
        non_existent = await repo.get_by_email("non-existent@example.com")
        assert non_existent is None

        # Clean up
        await user.delete()

    async def test_update_user(self, fake):
        # Create a test user
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        first_name = fake.first_name()
        last_name = fake.last_name()
        repo = UserRepository()
        user = await repo.create(
            {
                "email": email,
                "hashed_password": hashed_password,
                "first_name": first_name,
                "last_name": last_name,
            }
        )

        # Update the user
        new_first_name = fake.first_name()
        new_last_name = fake.last_name()

        updated_user = await repo.update(
            user.id,
            {
                "first_name": new_first_name,
                "last_name": new_last_name,
            },
        )

        # Verify user was updated correctly
        assert updated_user.first_name == new_first_name
        assert updated_user.last_name == new_last_name

        # Verify changes persisted to database
        db_user = await User.find_one(User.id == user.id)
        assert db_user.first_name == new_first_name
        assert db_user.last_name == new_last_name

        # Clean up
        await user.delete()

    async def test_delete_user(self, fake):
        # Create a test user
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        repo = UserRepository()
        user = await repo.create(
            {
                "email": email,
                "hashed_password": hashed_password,
            }
        )
        user_id = user.id

        # Verify user exists
        assert await User.find_one(User.id == user_id) is not None

        # Delete the user
        await repo.delete(user.id)

        # Verify user no longer exists
        assert await User.find_one(User.id == user_id) is None


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
        assert mock_user_repository.create.call_args[1]["email"] == user_data.email
        assert (
            mock_user_repository.create.call_args[1]["first_name"]
            == user_data.first_name
        )
        assert (
            mock_user_repository.create.call_args[1]["last_name"] == user_data.last_name
        )
        # Check password was hashed
        assert (
            mock_user_repository.create.call_args[1]["hashed_password"]
            != user_data.password
        )

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
    async def test_send_verification_token_success(
        self, auth_service, mock_user_repository, unverified_user
    ):
        # Setup
        mock_user_repository.get_by_email.return_value = unverified_user
        email = unverified_user.email

        # Execute
        with patch(
            "app.auth.service.create_verification_token", return_value="test_token"
        ):
            await auth_service.send_verification_token(email)

        # Verify
        mock_user_repository.get_by_email.assert_called_once_with(email)

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
        mock_user_repository.set_verified.assert_called_once_with(unverified_user)

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
        assert test_user.hashed_password == "new_hashed_password"
        mock_user_repository.update_user.assert_called_once_with(test_user)

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
        mock_user_repository.update_user.return_value = (
            test_user  # Mock returns the updated user
        )

        # Execute
        result = await auth_service.update_user_info(user_id, user_data)

        # Verify
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        assert test_user.first_name == new_first_name
        assert test_user.last_name == new_last_name
        mock_user_repository.update_user.assert_called_once_with(test_user)
        assert result.id == test_user.id
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

    async def test_delete_user_info_success(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup
        mock_user_repository.get_by_id.return_value = test_user
        user_id = test_user.id

        # Execute
        await auth_service.delete_user_info(user_id)

        # Verify
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        mock_user_repository.delete_user.assert_called_once_with(test_user)

    async def test_delete_user_info_not_found(self, auth_service, mock_user_repository):
        # Setup
        mock_user_repository.get_by_id.return_value = None
        user_id = "non_existent_id"

        # Execute and verify exception
        with pytest.raises(NotFoundError) as exc_info:
            await auth_service.delete_user_info(user_id)

        assert "User not found" in str(exc_info.value)
        mock_user_repository.delete_user.assert_not_called()

    async def test_change_password_success(
        self, auth_service, mock_user_repository, test_user
    ):
        # Setup
        mock_user_repository.get_by_id.return_value = test_user
        user_id = test_user.id
        old_password = "password123"
        new_password = "NewPassword123!"

        # Execute
        with patch("app.auth.service.verify_password", return_value=True):
            with patch(
                "app.auth.service.get_password_hash", return_value="new_hashed_password"
            ):
                await auth_service.change_password(user_id, old_password, new_password)

        # Verify
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        assert test_user.hashed_password == "new_hashed_password"
        mock_user_repository.update_user.assert_called_once_with(test_user)

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


class TestAuthRouter:
    """Integration tests for auth endpoints handling user operations"""

    @pytest.fixture(autouse=True)
    def patch_cookie_secure(self):
        """Patch cookie secure setting to False for tests"""
        with patch("app.settings.settings.COOKIE_SECURE", False):
            yield

    @pytest.fixture
    async def test_user(self, client, fake):
        """Create a verified user for testing"""
        email = fake.email()
        password = "Password123!"
        hashed_password = get_password_hash(password)

        user = User(
            email=email,
            hashed_password=hashed_password,
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            is_verified=True,
        )
        await user.insert()

        yield user, password

        # Cleanup
        await User.find_one(User.email == email).delete()

    async def test_register_endpoint(self, client, fake):
        """Test user registration endpoint"""
        # Create test data
        user_data = {
            "email": fake.email(),
            "password": "Password123!",
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
        }

        # Send registration request
        response = await client.post("/v1/auth/register", json=user_data)

        # Verify response
        assert response.status_code == 200
        assert (
            response.json()["message"]
            == "User registered successfully. Please verify your email."
        )

        # Verify user was created in DB
        user = await User.find_one(User.email == user_data["email"])
        assert user is not None
        assert user.email == user_data["email"]
        assert user.first_name == user_data["first_name"]
        assert user.last_name == user_data["last_name"]
        assert user.is_verified == False

    async def test_register_duplicate_email(self, client, test_user, fake):
        """Test registration with existing email fails"""
        user, _ = test_user

        # Try to register with existing email
        user_data = {
            "email": user.email,
            "password": "Password123!",
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
        }

        response = await client.post("/v1/auth/register", json=user_data)

        # Verify error response
        assert response.status_code == 400
        assert (
            f"User with email {user.email} already exists" in response.json()["detail"]
        )

    async def test_login_endpoint(self, client, test_user):
        """Test user login endpoint"""
        user, password = test_user

        login_data = {"email": user.email, "password": password}

        response = await client.post("/v1/auth/login", json=login_data)

        # Check response data
        assert response.status_code == 200
        assert response.json()["message"] == "Login successful"
        assert response.json()["data"]["id"] == user.id

        # Check for JWT in headers (FastAPI test client may not expose cookies directly)
        assert "set-cookie" in response.headers
        assert "access_token" in response.headers["set-cookie"].lower()

    async def test_login_invalid_credentials(self, client, test_user):
        """Test login with wrong password fails"""
        user, _ = test_user

        # Login with wrong password
        login_data = {"email": user.email, "password": "WrongPassword123!"}

        response = await client.post("/v1/auth/login", json=login_data)

        # Verify error response
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]

    async def test_logout_endpoint(self, client):
        """Test user logout endpoint"""
        response = await client.post("/v1/auth/logout")

        # Verify response
        assert response.status_code == 200
        assert response.json()["message"] == "Logout successful"

        # Verify cookie was deleted (value should be empty or expired)
        if "access_token" in response.cookies:
            assert not response.cookies["access_token"]

    async def test_me_endpoint(self, client, test_user):
        """Test get current user endpoint with authentication"""
        user, _ = test_user

        # Create token directly for test
        token = jwt.encode(
            {"sub": user.id}, settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )

        # Use Authorization header instead of cookies
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/v1/auth/me", headers=headers)

        assert response.status_code == 200
        assert response.json()["data"]["id"] == user.id
        assert response.json()["data"]["email"] == user.email

    async def test_update_user_info(self, client, test_user, fake):
        """Test update user info endpoint"""
        user, _ = test_user

        # Create token directly for test
        token = jwt.encode(
            {"sub": user.id}, settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )

        # Prepare update data and headers
        new_data = {"first_name": fake.first_name(), "last_name": fake.last_name()}
        headers = {"Authorization": f"Bearer {token}"}

        # Send request
        response = await client.put("/v1/auth/me", json=new_data, headers=headers)

        # Verify
        assert response.status_code == 200
        assert response.json()["data"]["first_name"] == new_data["first_name"]
        assert response.json()["data"]["last_name"] == new_data["last_name"]

    async def test_change_password(self, client, test_user):
        """Test change password endpoint"""
        user, old_password = test_user

        # Create token for auth
        token = jwt.encode(
            {"sub": user.id}, settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )

        # Password change data
        new_password = "NewPassword456!"
        password_data = {"password": old_password, "new_password": new_password}
        headers = {"Authorization": f"Bearer {token}"}

        # Send request
        response = await client.put(
            "/v1/auth/me/change-password", json=password_data, headers=headers
        )

        # Verify
        assert response.status_code == 200
        assert response.json()["message"] == "Password changed successfully"

    @patch("app.auth.service.create_verification_token")
    async def test_send_verification_token(self, mock_create_token, client, fake):
        """Test send verification token endpoint"""
        # Create unverified user
        email = fake.email()
        password = "Password123!"
        hashed_password = get_password_hash(password)

        user = User(email=email, hashed_password=hashed_password, is_verified=False)
        await user.insert()

        # Mock token creation
        mock_create_token.return_value = "test-verification-token"

        # Send verification token request
        response = await client.post(
            "/v1/auth/send-verification", json={"email": email}
        )

        # Verify response
        assert response.status_code == 200
        assert (
            response.json()["message"]
            == "Verification email sent. Please check your inbox."
        )

        # Cleanup
        await User.find_one(User.email == email).delete()
