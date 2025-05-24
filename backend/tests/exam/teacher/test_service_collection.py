import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from beanie import DeleteRules

from app.core.exceptions import (
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    UnprocessableEntityError,
)
from app.exam.models import ExamStatus, QuestionType
from app.exam.repository import CollectionRepository, QuestionRepository
from app.exam.teacher.schemas import (
    CollectionQuestionCount,
    CreateCollection,
    GetCollection,
    QuestionOrderSchema,
    QuestionSchema,
    UpdateCollection,
    UpdateQuestionSchema,
)
from app.exam.teacher.services.collection_service import CollectionService


class TestCollectionService:
    """Unit tests for CollectionService"""

    @pytest.fixture
    def collection_repository(self):
        """Mock collection repository"""
        return AsyncMock(spec=CollectionRepository)

    @pytest.fixture
    def question_repository(self):
        """Mock question repository"""
        return AsyncMock(spec=QuestionRepository)

    @pytest.fixture
    def service(self, collection_repository, question_repository):
        """Initialize service with mock repositories"""
        return CollectionService(collection_repository, question_repository)

    @pytest.fixture
    def user_id(self):
        """Test user ID"""
        return str(uuid.uuid4())

    @pytest.fixture
    def collection_id(self):
        """Test collection ID"""
        return str(uuid.uuid4())

    @pytest.fixture
    def question_id(self):
        """Test question ID"""
        return str(uuid.uuid4())

    @pytest.fixture
    def mock_collection(self, user_id):
        """Create a mock collection object"""
        collection = AsyncMock()
        collection.id = str(uuid.uuid4())
        collection.created_by = AsyncMock()
        collection.created_by.id = user_id
        collection.created_by.ref = AsyncMock()
        collection.created_by.ref.id = user_id
        collection.questions = []
        collection.status = ExamStatus.DRAFT
        return collection

    @pytest.fixture
    def mock_question(self, user_id, collection_id):
        """Create a mock question object"""
        question = AsyncMock()
        question.id = str(uuid.uuid4())
        question.created_by = AsyncMock()
        question.created_by.ref = AsyncMock()
        question.created_by.ref.id = user_id
        question.collection = AsyncMock()
        question.collection.id = collection_id
        question.collection.questions = []
        question.position = 0
        question.type = QuestionType.MCQ
        question.options = [
            AsyncMock(id=str(uuid.uuid4()), text="Option 1", is_correct=True),
            AsyncMock(id=str(uuid.uuid4()), text="Option 2", is_correct=False),
        ]
        return question

    async def test_create_collection(self, service, collection_repository, user_id):
        """Test creating a collection"""
        # Setup
        collection_data = CreateCollection(
            title="Test Collection", status=ExamStatus.DRAFT
        )
        mock_collection = AsyncMock()
        mock_collection.id = str(uuid.uuid4())
        collection_repository.create.return_value = mock_collection

        # Execute
        result = await service.create_collection(collection_data, user_id)

        # Verify
        collection_repository.create.assert_called_once()
        created_data = collection_repository.create.call_args[0][0]
        assert created_data["title"] == "Test Collection"
        assert created_data["created_by"] == user_id
        assert result == mock_collection.id

    async def test_get_collection_owner(
        self, service, collection_repository, mock_collection, user_id
    ):
        """Test getting a collection as owner"""
        # Setup
        collection_repository.get_by_id.return_value = mock_collection
        mock_collection.created_by.id = user_id

        # Use MagicMock for model_dump to return a dict instead of a coroutine
        mock_collection.model_dump = MagicMock(
            return_value={
                "id": mock_collection.id,
                "title": "Test Collection",
            }
        )

        # Execute
        result = await service.get_collection(user_id, mock_collection.id)

        # Verify
        collection_repository.get_by_id.assert_called_once_with(
            mock_collection.id, fetch_fields={"questions": 1, "created_by": 1}
        )
        assert result == {"id": mock_collection.id, "title": "Test Collection"}

    async def test_get_collection_public(
        self, service, collection_repository, mock_collection, user_id
    ):
        """Test getting a public collection as non-owner"""
        # Setup
        different_user_id = str(uuid.uuid4())
        collection_repository.get_by_id.return_value = mock_collection
        mock_collection.created_by.id = user_id  # Original owner
        mock_collection.status = ExamStatus.PUBLISHED

        # Use MagicMock for model_dump
        mock_collection.model_dump = MagicMock(
            return_value={
                "id": mock_collection.id,
                "title": "Public Collection",
            }
        )

        # Execute
        result = await service.get_collection(different_user_id, mock_collection.id)

        # Verify
        assert result == {"id": mock_collection.id, "title": "Public Collection"}

    async def test_get_collection_forbidden(
        self, service, collection_repository, mock_collection
    ):
        """Test getting a private collection as non-owner should be forbidden"""
        # Setup
        different_user_id = str(uuid.uuid4())
        collection_repository.get_by_id.return_value = mock_collection
        mock_collection.status = ExamStatus.DRAFT

        # Execute and Verify
        with pytest.raises(ForbiddenError):
            await service.get_collection(different_user_id, mock_collection.id)

    async def test_get_collection_not_found(
        self, service, collection_repository, collection_id
    ):
        """Test getting a non-existent collection"""
        # Setup
        collection_repository.get_by_id.return_value = None

        # Execute and Verify
        with pytest.raises(NotFoundError):
            await service.get_collection("any_user_id", collection_id)

    async def test_update_collection(
        self, service, collection_repository, mock_collection, user_id
    ):
        """Test updating a collection"""
        # Setup
        update_data = UpdateCollection(title="Updated Collection")
        collection_repository.get_by_id.return_value = mock_collection

        # Execute
        await service.update_collection(mock_collection.id, user_id, update_data)

        # Verify
        collection_repository.update.assert_called_once_with(
            mock_collection.id, {"title": "Updated Collection"}
        )

    async def test_update_collection_not_owner(
        self, service, collection_repository, mock_collection
    ):
        """Test updating a collection when not the owner"""
        # Setup
        different_user_id = str(uuid.uuid4())
        update_data = UpdateCollection(title="Updated Collection")
        collection_repository.get_by_id.return_value = mock_collection

        # Execute and Verify
        with pytest.raises(ForbiddenError):
            await service.update_collection(
                mock_collection.id, different_user_id, update_data
            )

    async def test_delete_collection(
        self, service, collection_repository, mock_collection, user_id
    ):
        """Test deleting a collection"""
        # Setup
        collection_repository.get_by_id.return_value = mock_collection

        # Execute
        await service.delete_collection(mock_collection.id, user_id)

        # Verify
        collection_repository.delete.assert_called_once_with(mock_collection.id)

    async def test_delete_collection_not_owner(
        self, service, collection_repository, mock_collection
    ):
        """Test deleting a collection when not the owner"""
        # Setup
        different_user_id = str(uuid.uuid4())
        collection_repository.get_by_id.return_value = mock_collection

        # Execute and Verify
        with pytest.raises(ForbiddenError):
            await service.delete_collection(mock_collection.id, different_user_id)

    async def test_validate_question_mcq_valid(self, service):
        """Test validating a valid MCQ question"""
        # Setup
        question_data = {
            "type": QuestionType.MCQ,
            "options": [
                {"text": "Option 1", "is_correct": True},
                {"text": "Option 2", "is_correct": False},
            ],
        }

        # Execute - should not raise an exception
        service._validate_question_by_type(question_data)

    async def test_validate_question_mcq_no_options(self, service):
        """Test validating an MCQ question with no options"""
        # Setup
        question_data = {"type": QuestionType.MCQ, "options": []}

        # Execute and Verify
        with pytest.raises(UnprocessableEntityError):
            service._validate_question_by_type(question_data)

    async def test_validate_question_mcq_no_correct(self, service):
        """Test validating an MCQ question with no correct answer"""
        # Setup
        question_data = {
            "type": QuestionType.MCQ,
            "options": [
                {"text": "Option 1", "is_correct": False},
                {"text": "Option 2", "is_correct": False},
            ],
        }

        # Execute and Verify
        with pytest.raises(UnprocessableEntityError):
            service._validate_question_by_type(question_data)

    async def test_validate_question_singlechoice_multiple_correct(self, service):
        """Test validating a singlechoice question with multiple correct answers"""
        # Setup
        question_data = {
            "type": QuestionType.SINGLECHOICE,
            "options": [
                {"text": "Option 1", "is_correct": True},
                {"text": "Option 2", "is_correct": True},
            ],
        }

        # Execute and Verify
        with pytest.raises(UnprocessableEntityError):
            service._validate_question_by_type(question_data)

    async def test_add_question_to_collection(
        self,
        service,
        collection_repository,
        question_repository,
        mock_collection,
        user_id,
    ):
        """Test adding a question to a collection"""
        # Setup
        collection_repository.get_by_id.return_value = mock_collection
        question_data = QuestionSchema(
            question_text="Test Question",
            type=QuestionType.MCQ,
            options=[
                {"text": "Option 1", "is_correct": True},
                {"text": "Option 2", "is_correct": False},
            ],
            position=1,
        )
        mock_question = AsyncMock()
        mock_question.id = str(uuid.uuid4())
        question_repository.create.return_value = mock_question

        # Execute
        result = await service.add_question_to_collection(
            mock_collection.id, user_id, question_data
        )

        # Verify
        question_repository.create.assert_called_once()
        collection_repository.save.assert_called_once_with(mock_collection)
        assert result == mock_question.id

    async def test_delete_question(
        self, service, question_repository, mock_question, user_id
    ):
        """Test deleting a question"""
        # Setup
        question_repository.get_by_id.return_value = mock_question

        # Execute
        await service.delete_question(mock_question.id, user_id)

        # Verify
        question_repository.delete.assert_called_once_with(
            mock_question.id, link_rule=DeleteRules.DELETE_LINKS
        )

    async def test_delete_question_not_owner(
        self, service, question_repository, mock_question
    ):
        """Test deleting a question when not the owner"""
        # Setup
        different_user_id = str(uuid.uuid4())
        question_repository.get_by_id.return_value = mock_question

        # Execute and Verify
        with pytest.raises(ForbiddenError):
            await service.delete_question(mock_question.id, different_user_id)

    async def test_get_teacher_collections(
        self, service, collection_repository, user_id
    ):
        """Test getting all collections for a teacher"""
        # Setup
        mock_collections = [
            AsyncMock(created_by=AsyncMock(id=user_id), questions=[]),
            AsyncMock(
                created_by=AsyncMock(id=user_id), questions=[AsyncMock(), AsyncMock()]
            ),
        ]
        collection_repository.get_all.return_value = mock_collections

        # Setup model_dump as MagicMock for each collection
        mock_collections[0].model_dump = MagicMock(
            return_value={
                "id": str(uuid.uuid4()),
                "title": "Collection 1",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "created_by": {
                    "id": user_id,
                    "email": "test@example.com",
                    "role": "teacher",  # Add this required field
                    "receive_notifications": True,  # Add this required field
                },
                "questions": [],
            }
        )
        mock_collections[1].model_dump = MagicMock(
            return_value={
                "id": str(uuid.uuid4()),
                "title": "Collection 2",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "created_by": {
                    "id": user_id,
                    "email": "test@example.com",
                    "role": "teacher",  # Add this required field
                    "receive_notifications": True,  # Add this required field
                },
                "questions": [{"id": "q1"}, {"id": "q2"}],
            }
        )

        # Execute
        result = await service.get_teacher_collections(user_id)

        # Add assertions for result