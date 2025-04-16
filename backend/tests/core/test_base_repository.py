import pytest
from app.auth.models import User
from app.auth.security import get_password_hash
from app.core.repository.base_repository import BaseRepository


class TestBaseRepository:
    """Tests for the BaseRepository generic methods"""

    @pytest.fixture
    def repository(self):
        """Create a BaseRepository instance using User model"""
        return BaseRepository(User)

    async def test_create(self, repository, fake):
        """Test create method"""
        # Setup test data
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        first_name = fake.first_name()
        last_name = fake.last_name()

        # Execute create method
        entity = await repository.create(
            {
                "email": email,
                "hashed_password": hashed_password,
                "first_name": first_name,
                "last_name": last_name,
            }
        )

        # Verify entity was created correctly
        assert entity is not None
        assert entity.email == email
        assert entity.hashed_password == hashed_password
        assert entity.first_name == first_name
        assert entity.last_name == last_name

        # Verify entity exists in database
        db_entity = await User.find_one(User.email == email)
        assert db_entity is not None
        assert db_entity.id == entity.id

    async def test_get_by_id(self, repository, fake):
        """Test get_by_id method"""
        # Create a test entity
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        entity = await repository.create(
            {
                "email": email,
                "hashed_password": hashed_password,
            }
        )
        entity_id = entity.id

        # Test get_by_id method
        fetched_entity = await repository.get_by_id(entity_id)

        # Verify correct entity was retrieved
        assert fetched_entity is not None
        assert fetched_entity.id == entity_id
        assert fetched_entity.email == email

        # Test with non-existent ID
        non_existent = await repository.get_by_id("non-existent-id")
        assert non_existent is None

    async def test_get_by_field(self, repository, fake):
        """Test get_by_field method"""
        # Create test user
        email = fake.email()
        role = "student"
        user = await repository.create(
            {
                "email": email,
                "hashed_password": get_password_hash("password123"),
                "role": role,
            }
        )

        # Test get by different fields
        found_by_email = await repository.get_by_field("email", email)
        found_by_role = await repository.get_by_field("role", role)

        # Verify found by email
        assert found_by_email is not None
        assert found_by_email.id == user.id
        assert found_by_email.email == email

        # Verify found by role (should work but might return any user with that role)
        assert found_by_role is not None
        assert found_by_role.role == role

        # Test with non-existent value
        non_existent = await repository.get_by_field("email", "nonexistent@example.com")
        assert non_existent is None

    async def test_get_all(self, repository, fake):
        """Test get_all method with and without filters"""
        # Create test users with different roles
        await repository.create(
            {
                "email": fake.email(),
                "hashed_password": get_password_hash("password123"),
                "role": "student",
            }
        )

        await repository.create(
            {
                "email": fake.email(),
                "hashed_password": get_password_hash("password123"),
                "role": "student",
            }
        )

        await repository.create(
            {
                "email": fake.email(),
                "hashed_password": get_password_hash("password123"),
                "role": "teacher",
            }
        )

        # Get all users
        all_users = await repository.get_all()
        assert len(all_users) >= 3

        # Get users filtered by role
        students = await repository.get_all({"role": "student"})
        teachers = await repository.get_all({"role": "teacher"})

        assert len(students) >= 2
        assert all(user.role == "student" for user in students)

        assert len(teachers) >= 1
        assert all(user.role == "teacher" for user in teachers)

    async def test_update(self, repository, fake):
        """Test update method"""
        # Create a test entity
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        first_name = fake.first_name()
        last_name = fake.last_name()
        entity = await repository.create(
            {
                "email": email,
                "hashed_password": hashed_password,
                "first_name": first_name,
                "last_name": last_name,
            }
        )

        # Update the entity
        new_first_name = fake.first_name()
        new_last_name = fake.last_name()

        updated_entity = await repository.update(
            entity.id,
            {
                "first_name": new_first_name,
                "last_name": new_last_name,
            },
        )

        # Verify entity was updated correctly
        assert updated_entity is not None
        assert updated_entity.first_name == new_first_name
        assert updated_entity.last_name == new_last_name

        # Verify changes persisted to database
        db_entity = await User.find_one(User.id == entity.id)
        assert db_entity.first_name == new_first_name
        assert db_entity.last_name == new_last_name

    async def test_delete(self, repository, fake):
        """Test delete method"""
        # Create a test entity
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        entity = await repository.create(
            {
                "email": email,
                "hashed_password": hashed_password,
            }
        )
        entity_id = entity.id

        # Verify entity exists
        assert await User.find_one(User.id == entity_id) is not None

        # Delete the entity
        result = await repository.delete(entity_id)

        # Verify deletion was successful
        assert result is True

        # Verify entity no longer exists
        assert await User.find_one(User.id == entity_id) is None

    async def test_save(self, repository, fake):
        """Test save method"""
        # Create a test entity
        email = fake.email()
        hashed_password = get_password_hash("TestPassword123!")
        entity = await repository.create(
            {
                "email": email,
                "hashed_password": hashed_password,
            }
        )

        # Modify entity and save
        entity.first_name = fake.first_name()
        saved_entity = await repository.save(entity)

        # Verify save was successful
        assert saved_entity.first_name == entity.first_name

        # Verify changes persisted to database
        db_entity = await User.find_one(User.id == entity.id)
        assert db_entity.first_name == entity.first_name