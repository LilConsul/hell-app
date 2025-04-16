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
        collection_data["created_by"] = user_id

        collection = await self.collection_repository.create(collection_data)
        return collection.id

    async def add_question_to_collection(
        self, collection_id: str, user_id: str, question_data: QuestionSchema
    ):
        """Add a question to a collection."""
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise ValueError("Collection not found")
        if collection.created_by != user_id:
            raise ValueError("You do not own this collection, can't add question to it")

        # Create the question
        question_data = question_data.model_dump()
        question_data["created_by"] = user_id
        question = await self.question_repository.create(question_data)

        # Add the question reference to the collection as a Link
        collection.questions.append(Link(question))
        await self.collection_repository.save(collection)

        return question.model_dump()

    async def get_collection(self, collection_id: str) -> GetCollection:
        """Get a collection by its ID."""
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise ValueError("Collection not found")

        # Get the questions associated with the collection
        questions = await self.question_repository.get_all_by_collection_id(
            collection_id
        )

        # Create a dictionary with all the collection data
        collection_data = collection.model_dump()

        # Replace the questions field with the actual question objects
        collection_data["questions"] = questions

        # Return the validated model
        return GetCollection.model_validate(collection_data)