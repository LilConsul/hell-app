import uuid

from app.core.exceptions import ForbiddenError, NotFoundError
from app.exam.repository import CollectionRepository, QuestionRepository
from app.exam.teacher.schemas import CreateCollection, GetCollection, QuestionSchema
from beanie import Link


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
        # TODO: created_by is Link to User not str
        collection_data["created_by"] = user_id

        collection = await self.collection_repository.create(collection_data)
        return collection.id

    async def add_question_to_collection(
        self, collection_id: str, user_id: str, question_data: QuestionSchema
    ):
        """Add a question to a collection."""
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

        # Transform options from strings to QuestionOption objects
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

    async def get_collection(self, collection_id: str) -> GetCollection:
        """Get a collection by its ID."""
        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_links=True
        )
        if not collection:
            raise NotFoundError("Collection not found")

        # Create a dictionary with all the collection data
        collection_data = collection.model_dump()
        if "questions" in collection_data and collection_data["questions"]:
            for question in collection_data["questions"]:
                if "options" in question and question["options"]:
                    question["options"] = [opt["text"] for opt in question["options"]]

        # Return the validated model
        return GetCollection.model_validate(collection_data)
