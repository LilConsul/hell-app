import uuid
from typing import List

from app.core.exceptions import ForbiddenError, NotFoundError
from app.exam.models import ExamStatus
from app.exam.repository import CollectionRepository, QuestionRepository
from app.exam.teacher.schemas import (
    CreateCollection,
    GetCollection,
    QuestionSchema,
    UpdateCollection,
    JustCollection,
    UpdateQuestionSchema,
)


class CollectionService:
    def __init__(
        self,
        collection_repository: CollectionRepository,
        question_repository: QuestionRepository,
    ):
        self.collection_repository = collection_repository
        self.question_repository = question_repository

    async def create_collection(
        self, collection_data: CreateCollection, user_id: str
    ) -> str:
        """Create a new collection, returning the collection ID."""
        collection_data = collection_data.model_dump()
        collection_data["created_by"] = user_id

        collection = await self.collection_repository.create(collection_data)
        return collection.id

    async def get_collection(self, user_id: str, collection_id: str) -> GetCollection:
        """Get a collection by its ID."""
        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_links=True
        )
        if not collection:
            raise NotFoundError("Collection not found")

        is_owner = user_id and collection.created_by.id == user_id
        is_public = collection.status == ExamStatus.PUBLISHED

        if not (is_owner or is_public):
            raise ForbiddenError("You don't have access to this collection")

        # Create a dictionary with all the collection data
        collection_data = collection.model_dump()
        if "questions" in collection_data and collection_data["questions"]:
            for question in collection_data["questions"]:
                if "options" in question and question["options"]:
                    question["options"] = [opt["text"] for opt in question["options"]]

        # Return the validated model
        return GetCollection.model_validate(collection_data)

    async def update_collection(
        self, collection_id: str, user_id: str, collection_data: UpdateCollection
    ) -> None:
        """Update a collection by its ID."""
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise NotFoundError("Collection not found")
        if collection.created_by.id != user_id:
            raise ForbiddenError("You do not own this collection")

        update_data = collection_data.model_dump(exclude_unset=True)
        await self.collection_repository.update(collection_id, update_data)

    async def delete_collection(self, collection_id: str, user_id: str) -> None:
        """Delete a collection by its ID."""
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise NotFoundError("Collection not found")
        if collection.created_by.id != user_id:
            raise ForbiddenError("You do not own this collection")

        await self.collection_repository.delete(collection_id)

    async def add_question_to_collection(
        self, collection_id: str, user_id: str, question_data: QuestionSchema
    ) -> str:
        """Add a question to a collection and return the question ID."""
        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_links=True
        )
        if not collection:
            raise NotFoundError("Collection not found")
        if collection.created_by.id != user_id:
            raise ForbiddenError(
                "You do not own this collection, can't add question to it"
            )

        # Create the question
        question_data_dict = question_data.model_dump()
        question_data_dict["_id"] = str(uuid.uuid4())

        if (
            isinstance(question_data_dict.get("options"), list)
            and question_data_dict["options"]
        ):
            if isinstance(question_data_dict["options"][0], str):
                question_data_dict["options"] = [
                    {"id": str(uuid.uuid4()), "text": opt, "is_correct": False}
                    for opt in question_data_dict["options"]
                ]

        question_data_dict["created_by"] = user_id
        question = await self.question_repository.create(question_data_dict)

        # Add the question reference to the collection as a Link
        collection.questions.append(question)
        await self.collection_repository.save(collection)
        return question.id

    async def edit_question(
        self, question_id: str, user_id: str, question_data: UpdateQuestionSchema
    ) -> None:
        """Edit an existing question by its ID."""
        question = await self.question_repository.get_by_id(
            question_id, fetch_links=True
        )
        if not question:
            raise NotFoundError("Question not found")

        # Check if user owns the question
        if question.created_by.id != user_id:
            raise ForbiddenError("You do not own this question")

        update_data = question_data.model_dump(exclude_unset=True)
        if "_id" in update_data:
            del update_data["_id"]

        # Transform options from strings to QuestionOption objects if needed
        if isinstance(update_data.get("options"), list) and update_data["options"]:
            if isinstance(update_data["options"][0], str):
                update_data["options"] = [
                    {"id": str(uuid.uuid4()), "text": opt, "is_correct": False}
                    for opt in update_data["options"]
                ]

        # Update the question
        await self.question_repository.update(question_id, update_data)

    async def get_teacher_collections(self, user_id: str) -> List[JustCollection]:
        """Get all collections created by a specific teacher."""
        collections = await self.collection_repository.get_by_creator(user_id)
        return [
            JustCollection.model_validate(
                {**collection.model_dump(), "questions": None}
            )
            for collection in collections
        ]

    async def get_public_collections(self) -> List[JustCollection]:
        """Get all published collections that are publicly available."""
        collections = await self.collection_repository.get_published()

        return [
            JustCollection.model_validate(
                {**collection.model_dump(), "questions": None}
            )
            for collection in collections
        ]

    async def delete_question(self, question_id: str, user_id: str) -> None:
        """Delete an existing question by its ID."""
        question = await self.question_repository.get_by_id(
            question_id, fetch_links=True
        )
        if not question:
            raise NotFoundError("Question not found")

        if question.created_by.id != user_id:
            raise ForbiddenError("You do not own this question")

        collections = await self.collection_repository.get_all()
        for collection in collections:
            if question in collection.questions:
                collection.questions.remove(question)
                await self.collection_repository.save(collection)

        # Delete the question
        await self.question_repository.delete(question_id)