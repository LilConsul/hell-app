import uuid
from unittest.mock import patch

import jwt
import pytest
from app.auth.models import User
from app.auth.schemas import UserRole
from app.auth.security import get_password_hash
from app.exam.models import (
    Collection,
    ExamStatus,
    Question,
    QuestionOption,
    QuestionType,
)
from app.settings import settings


class TestTeacherRouter:
    """Integration tests for teacher endpoints handling collections and questions"""

    @pytest.fixture
    async def teacher_user(self, fake):
        """Create a verified teacher for testing"""
        email = fake.email()
        user = User(
            email=email,
            hashed_password=get_password_hash("Password123!"),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            is_verified=True,
            role=UserRole.TEACHER,
        )
        await user.insert()
        yield user
        await User.find_one(User.email == email).delete()

    @pytest.fixture
    def auth_headers(self, teacher_user):
        """Create auth headers for teacher"""
        token = jwt.encode(
            {"sub": str(teacher_user.id), "role": teacher_user.role},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    async def test_collection(self, teacher_user):
        """Create a test collection"""
        collection = Collection(
            title="Test Collection",
            description="A collection for testing",
            created_by=teacher_user,
            status=ExamStatus.DRAFT,
        )
        await collection.insert()
        yield collection
        await Collection.find_one(Collection.id == collection.id).delete()

    @pytest.fixture
    async def test_question(self, teacher_user, test_collection):
        """Create a test question"""
        options = [
            QuestionOption(id=str(uuid.uuid4()), text="Paris", is_correct=True),
            QuestionOption(id=str(uuid.uuid4()), text="London", is_correct=False),
            QuestionOption(id=str(uuid.uuid4()), text="Berlin", is_correct=False),
        ]
        question = Question(
            question_text="What is the capital of France?",
            type=QuestionType.MCQ,
            created_by=teacher_user,
            options=options,
        )
        await question.insert()

        collection = await Collection.get(test_collection.id)
        collection.questions.append(question)
        await collection.save()

        yield question
        await Question.find_one(Question.id == question.id).delete()

    async def test_unauthorized_access(self, client):
        """Test unauthorized access to teacher endpoints"""
        response = await client.get("/v1/exam/teacher/collections/")
        assert response.status_code == 401

    async def test_create_collection(self, client, auth_headers):
        """Test creating a new collection"""
        collection_data = {
            "title": "New Collection",
            "description": "A collection for testing creation",
            "status": "draft",
        }
        response = await client.post(
            "/v1/exam/teacher/collections/",
            json=collection_data,
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["message"] == "Collection created successfully"

        # Cleanup
        collection_id = response.json()["data"]["collection_id"]
        await Collection.find_one(Collection.id == collection_id).delete()

    @patch("app.exam.teacher.services.CollectionService.get_teacher_collections")
    async def test_get_teacher_collections(self, mock_service, client, auth_headers):
        """Test retrieving teacher's collections"""
        mock_service.return_value = [
            {
                "id": str(uuid.uuid4()),
                "title": "Test Collection",
                "description": "A test collection",
                "status": "draft",
                "created_by": {
                    "id": str(uuid.uuid4()),
                    "email": "teacher@example.com",
                    "first_name": "Test",
                    "last_name": "Teacher",
                    "role": "teacher",
                    "receive_notifications": True,
                },
                "questions": [],  # Add this field
                "question_count": 0,  # Add this field
                "created_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-01T00:00:00",
            }
        ]

        response = await client.get(
            "/v1/exam/teacher/collections/", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Collections retrieved successfully"

    @patch("app.exam.teacher.services.CollectionService.get_collection")
    async def test_get_collection_by_id(
        self, mock_service, client, auth_headers, test_collection, test_question
    ):
        """Test getting a specific collection by ID"""
        from app.exam.teacher.schemas import GetCollection

        collection_dict = test_collection.model_dump()
        collection_dict["questions"] = [test_question.model_dump()]
        mock_service.return_value = GetCollection.model_validate(collection_dict)

        response = await client.get(
            f"/v1/exam/teacher/collections/{test_collection.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Collection retrieved successfully"

    @patch("app.exam.teacher.services.CollectionService.update_collection")
    async def test_update_collection(
        self, mock_service, client, auth_headers, test_collection
    ):
        """Test updating a collection"""
        update_data = {
            "title": "Updated Collection Title",
            "description": "Updated description",
            "status": "published",
        }
        response = await client.put(
            f"/v1/exam/teacher/collections/{test_collection.id}",
            json=update_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Collection updated successfully"

    @patch("app.exam.teacher.services.CollectionService.delete_collection")
    async def test_delete_collection(
        self, mock_service, client, auth_headers, test_collection
    ):
        """Test deleting a collection"""
        response = await client.delete(
            f"/v1/exam/teacher/collections/{test_collection.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Collection deleted successfully"

    @patch("app.exam.teacher.services.CollectionService.add_question_to_collection")
    async def test_add_question_to_collection(
        self, mock_service, client, auth_headers, test_collection
    ):
        """Test adding a question to a collection"""
        mock_service.return_value = str(uuid.uuid4())

        question_data = {
            "question_text": "What is the capital of Germany?",
            "type": "mcq",
            "options": [
                {"text": "Berlin", "is_correct": True},
                {"text": "Munich", "is_correct": False},
            ],
            "weight": 2,
        }
        response = await client.post(
            f"/v1/exam/teacher/collections/{test_collection.id}/questions",
            json=question_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Question added successfully"

    @patch("app.exam.teacher.services.CollectionService.edit_question")
    async def test_edit_question(
        self, mock_service, client, auth_headers, test_collection, test_question
    ):
        """Test editing a question"""
        update_data = {
            "id": None,
            "question_text": "Updated question text",
            "options": [
                {"text": "Updated Option 1", "is_correct": True},
                {"text": "Updated Option 2", "is_correct": False},
            ],
            "type": "mcq",
            "weight": 2,
            "has_katex": False,
        }
        response = await client.put(
            f"/v1/exam/teacher/collections/{test_collection.id}/questions/{test_question.id}",
            json=update_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Question updated successfully"

    @patch("app.exam.teacher.services.CollectionService.delete_question")
    async def test_delete_question(
        self, mock_service, client, auth_headers, test_collection, test_question
    ):
        """Test deleting a question"""
        response = await client.delete(
            f"/v1/exam/teacher/collections/{test_collection.id}/questions/{test_question.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Question deleted successfully"
        assert response.json()["data"]["collection_id"] == test_collection.id
        assert response.json()["data"]["question_id"] == test_question.id

    @patch("app.exam.teacher.services.CollectionService.get_public_collections")
    async def test_get_public_collections(self, mock_service, client, auth_headers):
        """Test retrieving public collections"""
        # Create mock public collections data
        mock_service.return_value = [
            {
                "id": str(uuid.uuid4()),
                "title": "Public Collection 1",
                "description": "A public collection for testing",
                "status": "published",
                "created_by": {
                    "id": str(uuid.uuid4()),
                    "email": "teacher@example.com",
                    "first_name": "Test",
                    "last_name": "Teacher",
                    "role": "teacher",
                    "receive_notifications": True,
                },
                "questions": [],  # Add this field
                "question_count": 0,  # Add this field
                "created_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-01T00:00:00",
            }
        ]

        # Test public collections endpoint with auth headers
        response = await client.get(
            "/v1/exam/teacher/collections/public", headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Public collections retrieved successfully"

    @patch("app.exam.teacher.services.CollectionService.get_public_collections")
    async def test_get_public_collections_empty(
        self, mock_service, client, auth_headers
    ):
        """Test retrieving public collections when none exist"""
        # Mock empty public collections
        mock_service.return_value = []

        # Test public collections endpoint with auth headers
        response = await client.get(
            "/v1/exam/teacher/collections/public", headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Public collections retrieved successfully"
        assert len(response.json()["data"]) == 0
