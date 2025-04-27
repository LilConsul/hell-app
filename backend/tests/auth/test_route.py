from unittest.mock import patch

import jwt
import pytest
from app.auth.models import User
from app.auth.security import get_password_hash
from app.settings import settings


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
        response = await client.get("/v1/users/me", headers=headers)

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
        response = await client.put("/v1/users/me", json=new_data, headers=headers)

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
            "/v1/users/me/change-password", json=password_data, headers=headers
        )

        # Verify
        assert response.status_code == 200
        assert response.json()["message"] == "Password changed successfully"

    @patch("app.auth.service.decode_verification_token")
    async def test_verify_token_endpoint(self, mock_decode_token, client, test_user):
        """Test verify token endpoint"""
        user, _ = test_user

        # Make sure user is unverified for this test
        user.is_verified = False
        await user.save()

        # Mock token verification
        mock_decode_token.return_value = {"user_id": user.id, "type": "verification"}

        # Send verification request
        response = await client.post("/v1/auth/verify", json={"token": "test-token"})

        # Verify response
        assert response.status_code == 200
        assert response.json()["message"] == "Email verified successfully"

        # Verify user is now marked as verified
        updated_user = await User.find_one(User.id == user.id)
        assert updated_user.is_verified is True

    @patch("app.auth.service.create_verification_token")
    async def test_send_password_reset_token(
        self, mock_create_token, client, test_user
    ):
        """Test send password reset token endpoint"""
        user, _ = test_user

        # Mock token creation
        mock_create_token.return_value = "test-reset-token"

        # Send password reset token request
        response = await client.post(
            "/v1/auth/send-password-reset", json={"email": user.email}
        )

        # Verify response
        assert response.status_code == 200
        assert (
            response.json()["message"]
            == "Password reset email sent. Please check your inbox."
        )

    @patch("app.auth.service.decode_verification_token")
    async def test_reset_password_endpoint(self, mock_decode_token, client, test_user):
        """Test reset password endpoint"""
        user, _ = test_user

        # Mock token verification
        mock_decode_token.return_value = {"user_id": user.id, "type": "password_reset"}

        # Send reset password request
        response = await client.post(
            "/v1/auth/reset-password",
            json={"token": "test-token", "password": "NewPassword789!"},
        )

        # Verify response
        assert response.status_code == 200
        assert response.json()["message"] == "Password reset successfully"

    @patch("app.users.services.decode_verification_token")
    async def test_delete_user_endpoint(self, mock_decode_token, client, test_user):
        """Test delete user endpoint"""
        user, _ = test_user

        # Create token for auth and mock verification token
        token = jwt.encode(
            {"sub": user.id}, settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )
        mock_decode_token.return_value = {"user_id": user.id, "type": "user_deletion"}

        # Send delete request
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.delete(
            "/v1/users/me", 
            headers=headers, 
            json={"token": "test-token"}
        )

        # Verify response
        assert response.status_code == 200
        assert response.json()["message"] == "User deleted successfully"

        # Verify user was deleted
        deleted_user = await User.find_one(User.id == user.id)
        assert deleted_user is None

