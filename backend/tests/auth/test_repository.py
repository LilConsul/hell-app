import pytest
from app.auth.models import User
from app.auth.repository import UserRepository
from app.auth.security import get_password_hash


class TestUserRepository:
    """Test suite for the UserRepository class"""

    @pytest.fixture
    def repository(self):
        """Create a UserRepository instance"""
        return UserRepository(User)

    async def test_get_by_email(self, repository, fake):
        # Create a test user
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        user = await repository.create(
            {
                "email": email,
                "hashed_password": hashed_password,
            }
        )

        # Test get_by_email method
        fetched_user = await repository.get_by_email(email)

        # Verify correct user was retrieved
        assert fetched_user is not None
        assert fetched_user.id == user.id
        assert fetched_user.email == email

        # Test with non-existent email
        non_existent = await repository.get_by_email("non-existent@example.com")
        assert non_existent is None
