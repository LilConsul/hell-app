import uuid
from unittest.mock import patch, MagicMock

import jwt
import pytest

from app.auth.models import User
from app.auth.schemas import UserRole
from app.auth.security import get_password_hash
from app.exam.models import (
    Collection,
    ExamStatus,
    Question,
    QuestionType,
    QuestionOption,
)
from app.settings import settings


class TestTeacherRouter:
    """Integration tests for teacher endpoints handling collections and questions"""

    @pytest.fixture
    async def teacher_user(self, client, fake):
        """Create a verified teacher for testing"""
        email = fake.email()
        password = "Password123!"
        hashed_password = get_password_hash(password)

        user = User(
            email=email,
            hashed_password=hashed_password,
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            is_verified=True,
            role=UserRole.TEACHER,
        )
        await user.insert()

        yield user, password

        # Cleanup
        await User.find_one(User.email == email).delete()

    @pytest.fixture
    def teacher_auth_headers(self, teacher_user):
        """Create auth headers for teacher"""
        user, _ = teacher_user
        token = jwt.encode(
            {"sub": str(user.id), "role": user.role},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    async def test_collection(self, teacher_user):
        """Create a test collection"""
        user, _ = teacher_user
        collection = Collection(
            title="Test Collection",
            description="A collection for testing",
            created_by=user,
            status=ExamStatus.DRAFT,
        )
        await collection.insert()

        yield collection

        # Cleanup
        await Collection.find_one(Collection.id == collection.id).delete()

    @pytest.fixture
    async def test_question(self, teacher_user, test_collection):
        """Create a test question"""
        user, _ = teacher_user

        options = [
            QuestionOption(id=str(uuid.uuid4()), text="Paris", is_correct=True),
            QuestionOption(id=str(uuid.uuid4()), text="London", is_correct=False),
            QuestionOption(id=str(uuid.uuid4()), text="Berlin", is_correct=False),
        ]

        question = Question(
            question_text="What is the capital of France?",
            type=QuestionType.MCQ,
            created_by=user,
            options=options,
        )
        await question.insert()

        # Add question to collection
        collection = await Collection.get(test_collection.id)
        collection.questions.append(question)
        await collection.save()

        yield question

        # Cleanup
        await Question.find_one(Question.id == question.id).delete()

    async def test_unauthorized_access(self, client):
        """Test unauthorized access to teacher endpoints"""
        response = await client.get("/v1/exam/teacher/collections")
        assert response.status_code == 401

    async def test_create_collection(self, client, teacher_auth_headers):
        """Test creating a new collection"""
        collection_data = {
            "title": "New Collection",
            "description": "A collection for testing creation",
            "status": "draft",
        }

        response = await client.post(
            "/v1/exam/teacher/collections",
            json=collection_data,
            headers=teacher_auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Collection created successfully"
        assert "collection_id" in data["data"]

        # Cleanup
        collection_id = data["data"]["collection_id"]
        await Collection.find_one(Collection.id == collection_id).delete()

    @patch("app.exam.teacher.services.CollectionService.get_teacher_collections")
    async def test_get_teacher_collections(
        self, mock_get_teacher_collections, client, teacher_auth_headers
    ):
        """Test retrieving teacher's collections"""
        # Mock the service return value with proper JustCollection format
        mock_collections = [
            {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Test Collection",
                "description": "A test collection",
                "status": "draft",
                "created_by": {
                    "id": "123e4567-e89b-12d3-a456-426614174001",
                    "email": "teacher@example.com",
                    "first_name": "Test",
                    "last_name": "Teacher",
                    "role": "teacher",
                },
                "questions": None,
                "created_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-01T00:00:00",
            }
        ]

        mock_get_teacher_collections.return_value = mock_collections

        response = await client.get(
            "/v1/exam/teacher/collections", headers=teacher_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Collections retrieved successfully"
        mock_get_teacher_collections.assert_called_once()

    @patch("app.exam.teacher.services.CollectionService.get_public_collections")
    async def test_get_public_collections(
        self,
        mock_get_public_collections,
        client,
        teacher_auth_headers,
        test_collection,
        teacher_user,
    ):
        """Test retrieving public collections"""
        user, _ = teacher_user

        # Create properly formatted collection that matches JustCollection schema
        collection_dict = {
            "id": str(test_collection.id),
            "title": test_collection.title,
            "description": test_collection.description,
            "status": ExamStatus.PUBLISHED,
            "created_by": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
            "questions": None,
            "created_at": test_collection.created_at,
            "updated_at": test_collection.updated_at,
        }

        mock_get_public_collections.return_value = [collection_dict]

        response = await client.get(
            "/v1/exam/teacher/collections/public", headers=teacher_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Public collections retrieved successfully"
        assert isinstance(data["data"], list)
        mock_get_public_collections.assert_called_once()

    @patch("app.exam.teacher.services.CollectionService.get_collection")
    async def test_get_collection_by_id(
        self,
        mock_get_collection,
        client,
        teacher_auth_headers,
        test_collection,
        test_question,
    ):
        """Test getting a specific collection by ID"""
        # Create a mock collection response with proper structure
        collection_dict = test_collection.model_dump()
        collection_dict["questions"] = [test_question.model_dump()]

        from app.exam.teacher.schemas import GetCollection

        mock_get_collection.return_value = GetCollection.model_validate(collection_dict)

        response = await client.get(
            f"/v1/exam/teacher/collections/{test_collection.id}",
            headers=teacher_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Collection retrieved successfully"
        assert data["data"]["id"] == str(test_collection.id)
        assert data["data"]["title"] == test_collection.title

    @patch("app.exam.teacher.services.CollectionService.update_collection")
    async def test_update_collection(
        self, mock_update_collection, client, teacher_auth_headers, test_collection
    ):
        """Test updating a collection"""
        # Setup the mock
        mock_update_collection.return_value = None

        update_data = {
            "title": "Updated Collection Title",
            "description": "Updated description",
            "status": "published",
        }

        response = await client.put(
            f"/v1/exam/teacher/collections/{test_collection.id}",
            json=update_data,
            headers=teacher_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Collection updated successfully"
        mock_update_collection.assert_called_once()

    @patch("app.exam.teacher.services.CollectionService.delete_collection")
    async def test_delete_collection(
        self, mock_delete_collection, client, teacher_auth_headers, test_collection
    ):
        """Test deleting a collection"""
        # Setup the mock
        mock_delete_collection.return_value = None

        response = await client.delete(
            f"/v1/exam/teacher/collections/{test_collection.id}",
            headers=teacher_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Collection deleted successfully"
        mock_delete_collection.assert_called_once()

    @patch("app.exam.teacher.services.CollectionService.add_question_to_collection")
    async def test_add_question_to_collection(
        self, mock_add_question, client, teacher_auth_headers, test_collection
    ):
        """Test adding a question to a collection"""
        question_id = str(uuid.uuid4())
        mock_add_question.return_value = question_id

        # Prepare request data with proper format for QuestionSchema
        question_data = {
            "question_text": "What is the capital of Germany?",
            "type": "mcq",
            "options": [
                {"text": "Berlin", "is_correct": True},
                {"text": "Munich", "is_correct": False},
                {"text": "Frankfurt", "is_correct": False},
            ],
            "weight": 2,
        }

        response = await client.post(
            f"/v1/exam/teacher/collections/{test_collection.id}/questions",
            json=question_data,
            headers=teacher_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Question added successfully"
        assert data["data"]["question_id"] == question_id
        mock_add_question.assert_called_once()

    @patch("app.exam.teacher.services.CollectionService.edit_question")
    async def test_edit_question(
        self,
        mock_edit_question,
        client,
        teacher_auth_headers,
        test_question,
        test_collection,
        teacher_user,
    ):
        """Test editing a question"""
        user, _ = teacher_user

        # Setup the mock
        mock_edit_question.return_value = None

        # Create properly formatted update data
        update_data = {
            "id": None,
            "question_text": "Updated question text",
            "options": [
                {"text": "Updated Option 1", "is_correct": True},
                {"text": "Updated Option 2", "is_correct": False},
                {"text": "Updated Option 3", "is_correct": False},
                {"text": "Updated Option 4", "is_correct": False},
            ],
            "type": "mcq",
            "has_katex": False,
            "weight": 2,
        }

        response = await client.put(
            f"/v1/exam/teacher/collections/{test_collection.id}/questions/{test_question.id}",
            json=update_data,
            headers=teacher_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Question updated successfully"
        mock_edit_question.assert_called_once()
