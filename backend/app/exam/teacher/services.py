from beanie import Link

from app.core.exceptions import ForbiddenError, NotFoundError
from app.exam.repository import CollectionRepository, QuestionRepository
from app.exam.teacher.schemas import CreateCollection, GetCollection, QuestionSchema


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
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise NotFoundError("Collection not found")
        if collection.created_by != user_id:
            raise ForbiddenError(
                "You do not own this collection, can't add question to it"
            )

        # Create the question
        question_data = question_data.model_dump()
        question_data["created_by"] = user_id
        question = await self.question_repository.create(question_data)

        # Add the question reference to the collection as a Link
        collection.questions.append(Link(question))
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

        # Return the validated model
        return GetCollection.model_validate(collection_data)
