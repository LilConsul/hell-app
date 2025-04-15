import pytest
from httpx import AsyncClient
from app.auth.schemas import UserCreate, UserLogin


class TestAuth:
    # Registration tests
    async def test_register_success(self, client: AsyncClient, fake):
        user_data = {
            "email": fake.email(),
            "password": "Password123!",
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
        }
        response = await client.post("/v1/auth/register", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["first_name"] == user_data["first_name"]
        assert data["last_name"] == user_data["last_name"]
        assert "id" in data
        assert not data["is_verified"]

    async def test_register_duplicate_email(self, client: AsyncClient, fake):
        email = fake.email()
        user_data = {
            "email": email,
            "password": "Password123!",
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
        }
        # First registration
        await client.post("/v1/auth/register", json=user_data)

        # Second registration with same email
        response = await client.post("/v1/auth/register", json=user_data)
        assert response.status_code == 400
        assert f"User with email {email} already exists" in response.json()["detail"]

    # Login tests
    async def test_login_unverified_user(self, client: AsyncClient, fake):
        # Register a user
        email = fake.email()
        password = "Password123!"
        user_data = {
            "email": email,
            "password": password,
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
        }
        await client.post("/v1/auth/register", json=user_data)

        # Try to login (should fail because user is not verified)
        login_data = {"email": email, "password": password}
        response = await client.post("/v1/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Email not verified" in response.json()["detail"]

    async def test_login_verified_user(self, client: AsyncClient, fake):
        # Register a user
        email = fake.email()
        password = "Password123!"
        user_data = {
            "email": email,
            "password": password,
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
        }
        register_response = await client.post("/v1/auth/register", json=user_data)
        user_id = register_response.json()["id"]

        # Manually verify the user (simulating verification)
        # In a real scenario, we'd use the verification token, but for testing,
        # we can directly modify the user in the mock database
        from app.auth.models import User

        user = await User.find_one(User.id == user_id)
        user.is_verified = True
        await user.save()

        # Now login should succeed
        login_data = {"email": email, "password": password}
        response = await client.post("/v1/auth/login", json=login_data)
        assert response.status_code == 200
        assert "access_token" in response.json()

    async def test_login_wrong_password(self, client: AsyncClient, fake):
        # Register and verify a user
        email = fake.email()
        password = "Password123!"
        user_data = {
            "email": email,
            "password": password,
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
        }
        register_response = await client.post("/v1/auth/register", json=user_data)
        user_id = register_response.json()["id"]

        # Verify the user
        from app.auth.models import User

        user = await User.find_one(User.id == user_id)
        user.is_verified = True
        await user.save()

        # Try login with wrong password
        login_data = {"email": email, "password": "WrongPassword123!"}
        response = await client.post("/v1/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]

    # Verification token tests
    async def test_send_verification_token(self, client: AsyncClient, fake):
        email = fake.email()
        user_data = {
            "email": email,
            "password": "Password123!",
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
        }
        await client.post("/v1/auth/register", json=user_data)

        response = await client.post(
            "/v1/auth/send-verification", json={"email": email}
        )
        assert response.status_code == 200
        assert "message" in response.json()

    # User info tests (these require authentication)
    async def test_get_user_info_authenticated(self, client: AsyncClient, fake):
        # Register, verify, and login a user
        email = fake.email()
        password = "Password123!"
        user_data = UserCreate(
            email=email,
            password=password,
            first_name=fake.first_name(),
            last_name=fake.last_name(),
        )
        register_response = await client.post(
            "/v1/auth/register", json=user_data.model_dump()
        )
        user_id = register_response.json()["id"]

        # Verify user
        from app.auth.models import User

        user = await User.find_one(User.id == user_id)
        user.is_verified = True
        await user.save()

        # Login and get token
        login_data = UserLogin(email=email, password=password)
        login_response = await client.post(
            "/v1/auth/login", json=login_data.model_dump()
        )
        token = login_response.json()["access_token"]

        # Get user info with token
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/v1/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        assert data["first_name"] == user_data.first_name
        assert data["last_name"] == user_data.last_name

    async def test_get_user_info_unauthenticated(self, client: AsyncClient):
        response = await client.get("/v1/auth/me")
        assert response.status_code == 401

    async def test_logout(self, client: AsyncClient, fake):
        # Register, verify, and login a user
        email = fake.email()
        password = "Password123!"
        user_data = UserCreate(
            email=email,
            password=password,
            first_name=fake.first_name(),
            last_name=fake.last_name(),
        )
        register_response = await client.post(
            "/v1/auth/register", json=user_data.model_dump()
        )
        user_id = register_response.json()["id"]

        # Verify user
        from app.auth.models import User

        user = await User.find_one(User.id == user_id)
        user.is_verified = True
        await user.save()

        # Login
        login_data = UserLogin(email=email, password=password)
        login_response = await client.post(
            "/v1/auth/login", json=login_data.model_dump()
        )
        token = login_response.json()["access_token"]

        # Logout with token
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.post("/v1/auth/logout", headers=headers)
        assert response.status_code == 200
        assert "message" in response.json()