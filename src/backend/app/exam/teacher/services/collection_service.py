import uuid
from typing import List

from beanie import DeleteRules

from app.core.exceptions import (
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    UnprocessableEntityError,
)
from app.exam.models import ExamStatus, QuestionType
from app.exam.repository import (
    CategoryRepository,
    CollectionRepository,
    QuestionRepository,
    ExamInstanceRepository,
)
from app.exam.teacher.schemas import (
    CollectionQuestionCount,
    CreateCollection,
    GetCollection,
    QuestionOrderSchema,
    QuestionSchema,
    UpdateCollection,
    UpdateQuestionSchema,
)
from app.i18n import _


class CollectionService:
    def __init__(
        self,
        collection_repository: CollectionRepository,
        question_repository: QuestionRepository,
        exam_instance_repository: ExamInstanceRepository,
        category_repository: CategoryRepository,
    ):
        self.collection_repository = collection_repository
        self.question_repository = question_repository
        self.exam_instance_repository = exam_instance_repository
        self.category_repository = category_repository

    async def create_collection(
        self, collection_data: CreateCollection, user_id: str
    ) -> str:
        """Create a new collection with categories, returning the collection ID."""
        collection_dict = collection_data.model_dump()
        category_names = collection_dict.pop("categories", [])
        collection_dict["created_by"] = user_id

        # Create or get categories
        category_links = []
        for category_name in category_names:
            category = await self.category_repository.get_or_create(category_name)
            category_links.append(category)
        
        collection_dict["categories"] = category_links
        collection = await self.collection_repository.create(collection_dict)
        return collection.id

    async def get_collection(self, user_id: str, collection_id: str) -> GetCollection:
        """Get a collection by its ID."""
        from app.auth.models import User
        from app.exam.models import Question, Category
        
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise NotFoundError(_("Collection not found"))
        
        # Fetch created_by user
        created_by_user = await User.get(collection.created_by.ref.id)
        if not created_by_user:
            raise NotFoundError(_("User not found"))
        
        # Check permissions
        is_owner = user_id and created_by_user.id == user_id
        is_public = collection.status == ExamStatus.PUBLISHED

        if not (is_owner or is_public):
            raise ForbiddenError(_("You don't have access to this collection"))

        # Fetch all questions
        questions_list = []
        for q_link in collection.questions:
            q = await Question.get(q_link.ref.id)
            if q:
                questions_list.append(q)
        
        questions_list.sort(key=lambda q: getattr(q, "position", float("inf")))
        
        # Fetch all categories
        categories_list = []
        for cat_link in collection.categories:
            cat = await Category.get(cat_link.ref.id)
            if cat:
                categories_list.append({"name": cat.name})

        # Manually construct response dict
        result = {
            "id": collection.id,
            "title": collection.title,
            "description": collection.description,
            "status": collection.status,
            "created_at": collection.created_at,
            "updated_at": collection.updated_at,
            "created_by": created_by_user.model_dump(),
            "questions": [q.model_dump() for q in questions_list],
            "categories": categories_list
        }
        
        return result

    async def update_collection(
        self, collection_id: str, user_id: str, collection_data: UpdateCollection
    ) -> None:
        """Update a collection by its ID, including categories."""
        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_links=True
        )
        if not collection:
            raise NotFoundError(_("Collection not found"))
        if collection.created_by.ref.id != user_id:
            raise ForbiddenError(_("You do not own this collection"))

        update_data = collection_data.model_dump(exclude_unset=True)
        
        # Handle categories update separately
        if "categories" in update_data:
            new_category_names = update_data.pop("categories")
            await self._update_collection_categories(collection, new_category_names)
        
        if update_data:
            await self.collection_repository.update(collection_id, update_data)
    
    async def _update_collection_categories(
        self, collection, new_category_names: List[str]
    ) -> None:
        """Update categories for a collection and clean up orphaned categories."""
        # Store old category names for cleanup
        old_category_names = [cat.ref.id for cat in collection.categories]
        
        # Create or get new categories
        new_category_links = []
        for category_name in new_category_names:
            category = await self.category_repository.get_or_create(category_name)
            new_category_links.append(category)
        
        # Update collection categories
        collection.categories = new_category_links
        await self.collection_repository.save(collection)
        
        # Check and delete old categories without collections
        for old_cat_name in old_category_names:
            if old_cat_name not in new_category_names:
                from app.exam.models import Collection, Category
                count = await Collection.find(
                    {"categories.$id": old_cat_name}
                ).count()
                if count == 0:
                    category = await Category.find_one(
                        Category.name == old_cat_name
                    )
                    if category:
                        await category.delete()

    async def delete_collection(self, collection_id: str, user_id: str) -> None:
        """Delete a collection by its ID."""
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise NotFoundError(_("Collection not found"))
        if collection.created_by.ref.id != user_id:
            raise ForbiddenError(_("You do not own this collection"))
        if await self.exam_instance_repository.get_by_field(
            "collection_id.$id", collection_id
        ):
            raise BadRequestError(
                _("Cannot delete collection with active exam instances")
            )

        await self.collection_repository.delete(collection_id)

    @staticmethod
    def _validate_question_by_type(question_data: dict) -> None:
        """
        Validate question data based on its type.

        Args:
            question_data: The question data to validate

        Raises:
            UnprocessableEntityError: If the question data is invalid for its type
        """
        question_type = question_data.get("type")
        if not question_type:
            raise UnprocessableEntityError(_("Question type is required"))

        # For MCQ and SINGLECHOICE: validate options
        if question_type in [QuestionType.MCQ, QuestionType.SINGLECHOICE]:
            options = question_data.get("options", [])
            if not options:
                raise UnprocessableEntityError(
                    _("{question_type} question must have options").format(
                        question_type=question_type.value.upper()
                    )
                )

            correct_count = sum(1 for opt in options if opt.get("is_correct"))

            if correct_count == 0:
                raise UnprocessableEntityError(
                    _(
                        "{question_type} question must have at least one correct answer"
                    ).format(question_type=question_type.value.upper())
                )

            if question_type == QuestionType.SINGLECHOICE and correct_count > 1:
                raise UnprocessableEntityError(
                    _(
                        "{QuestionType} question must have exactly one correct answer"
                    ).format(QuestionType=QuestionType.SINGLECHOICE.value.upper())
                )

        # For SHORTANSWER: validate correct_input_answer
        elif question_type == QuestionType.SHORTANSWER:
            if not question_data.get("correct_input_answer"):
                raise UnprocessableEntityError(
                    _(
                        "{QuestionType} question must have a correct_input_answer"
                    ).format(QuestionType=QuestionType.SHORTANSWER.value.upper())
                )

    async def add_question_to_collection(
        self, collection_id: str, user_id: str, question_data: QuestionSchema
    ) -> str:
        """Add a question to a collection and return the question ID."""
        collection = await self._get_collection_with_permission_check(
            collection_id, user_id
        )

        # Set position if not provided
        existing_positions = self._get_existing_positions(collection)
        self._assign_position_if_needed(question_data, existing_positions)
        self._validate_position_available(question_data.position, existing_positions)

        # Create and add question
        question_data_dict = self._prepare_question_data(question_data, user_id)
        self._validate_question_by_type(question_data_dict)

        question = await self.question_repository.create(question_data_dict)
        collection.questions.append(question)
        await self.collection_repository.save(collection)

        return question.id

    async def add_question_to_collection_bulk(
        self, collection_id: str, user_id: str, question_list: List[QuestionSchema]
    ) -> List[str]:
        """Add multiple questions to a collection in a single operation."""
        collection = await self._get_collection_with_permission_check(
            collection_id, user_id
        )
        existing_positions = self._get_existing_positions(collection)

        question_ids = []
        for question_data in question_list:
            self._assign_position_if_needed(question_data, existing_positions)
            self._validate_position_available(
                question_data.position, existing_positions
            )
            existing_positions.append(question_data.position)  # Update tracking list

            question_data_dict = self._prepare_question_data(question_data, user_id)
            self._validate_question_by_type(question_data_dict)

            question = await self.question_repository.create(question_data_dict)
            collection.questions.append(question)
            question_ids.append(question.id)

        await self.collection_repository.save(collection)
        return question_ids

    async def _get_collection_with_permission_check(
        self, collection_id: str, user_id: str
    ):
        """Get collection and check permissions."""
        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_fields={"questions": 1}
        )
        if not collection:
            raise NotFoundError(
                _("Collection with ID {collection_id} not found").format(
                    collection_id=collection_id
                )
            )

        if collection.created_by.ref.id != user_id:
            raise ForbiddenError(
                _("You don't have permission to add questions to this collection")
            )
        return collection

    @staticmethod
    def _get_existing_positions(collection):
        """Extract existing question positions from collection."""
        return [q.position for q in collection.questions if hasattr(q, "position")]

    @staticmethod
    def _assign_position_if_needed(question_data, existing_positions):
        """Assign a position to the question if not provided."""
        if not question_data.position:
            available_position = 0
            while available_position in existing_positions:
                available_position += 1
            question_data.position = available_position

    @staticmethod
    def _validate_position_available(position, existing_positions):
        """Check if the position is already taken."""
        if position in existing_positions:
            raise UnprocessableEntityError(
                _(
                    "Question with position {position} already exists in the collection"
                ).format(position=position)
            )

    @staticmethod
    def _prepare_question_data(question_data, user_id):
        """Prepare question data dictionary for creation."""
        question_data_dict = question_data.model_dump()
        question_data_dict["_id"] = str(uuid.uuid4())
        question_data_dict["created_by"] = user_id

        if "options" in question_data_dict:
            question_data_dict["options"] = [
                {
                    "id": str(uuid.uuid4()),
                    "text": opt["text"],
                    "is_correct": opt["is_correct"],
                }
                for opt in question_data_dict["options"]
            ]

        return question_data_dict

    async def edit_question(
        self, question_id: str, user_id: str, question_data: UpdateQuestionSchema
    ) -> None:
        """Edit an existing question by its ID."""
        question = await self.question_repository.get_by_id(
            question_id, fetch_fields={"collection": 1}
        )
        if not question:
            raise NotFoundError(_("Question not found"))

        if question.created_by.ref.id != user_id:
            raise ForbiddenError(_("You do not own this question"))

        # Check if the question position is already taken
        if (
            hasattr(question_data, "position")
            and question_data.position != question.position
        ):
            existing_positions = {
                q.position
                for q in question.collection.questions
                if hasattr(q, "position") and q.id != question.id
            }

            if question_data.position in existing_positions:
                raise UnprocessableEntityError(
                    _(
                        "Question with position {position} already exists in the collection"
                    ).format(position=question_data.position)
                )

        update_data = question_data.model_dump(exclude_unset=True)
        if "_id" in update_data:
            del update_data["_id"]

        if "options" in update_data:
            update_data["options"] = [
                {
                    "id": str(uuid.uuid4()),
                    "text": opt["text"],
                    "is_correct": opt["is_correct"],
                }
                for opt in update_data["options"]
            ]

        merged_data = question.model_dump()
        merged_data.update(update_data)

        self._validate_question_by_type(merged_data)

        await self.question_repository.update(question_id, update_data)

    async def reorder_questions(
        self, collection_id, teacher_id, question_ids: QuestionOrderSchema
    ):
        """Reorder questions in a collection based on provided positions."""
        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_fields={"questions": 1}
        )
        if not collection:
            raise NotFoundError(_("Collection not found"))
        if collection.created_by.ref.id != teacher_id:
            raise ForbiddenError(_("You do not own this collection"))

        collection_question_ids = {q.id for q in collection.questions}
        for question_id in question_ids.question_orders:
            if question_id not in collection_question_ids:
                raise BadRequestError(
                    _(
                        "Question ID {question_id} does not exist in the collection"
                    ).format(question_id=question_id)
                )

        existing_positions = {
            q.position
            for q in collection.questions
            if q.id not in question_ids.question_orders and hasattr(q, "position")
        }

        new_positions = set()
        for question_id, position in question_ids.question_orders.items():
            if position < 0:
                raise BadRequestError(
                    _("Position cannot be negative for question {question_id}").format(
                        question_id=question_id
                    )
                )
            if position in new_positions:
                raise BadRequestError(
                    _(
                        "Duplicate position {position} found. Positions must be unique"
                    ).format(position=position)
                )
            if position in existing_positions:
                raise BadRequestError(
                    _("Position {position} is already used by another question").format(
                        position=position
                    )
                )

            new_positions.add(position)

        for question_id, position in question_ids.question_orders.items():
            await self.question_repository.update(question_id, {"position": position})

        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_fields={"questions": 1}
        )
        collection.questions.sort(key=lambda q: getattr(q, "position", float("inf")))
        await self.collection_repository.save(collection)

    async def get_teacher_collections(
        self, user_id: str, category: str | None = None
    ) -> List[CollectionQuestionCount] | []:
        """Get all collections created by a specific teacher, optionally filtered by category."""
        query = {"created_by.$id": user_id}
        
        collections = await self.collection_repository.get_all(
            query, fetch_links=True
        )

        return await self._process_collections(collections, category)

    async def get_public_collections(self, category: str | None = None) -> List[CollectionQuestionCount] | []:
        """Get all published collections that are publicly available, optionally filtered by category."""
        query = {"status": ExamStatus.PUBLISHED}
        
        collections = await self.collection_repository.get_all(
            query,
            fetch_links=True
        )
        
        return await self._process_collections(collections, category)

    @staticmethod
    async def _process_collections(collections, category: str | None = None) -> List[CollectionQuestionCount] | []:
        """Process collection data and add question count."""
        from app.auth.models import User
        from app.exam.models import Category
        
        result = []
        for collection in collections:
            # Fetch created_by user
            created_by_user = await User.get(collection.created_by.ref.id)
            if not created_by_user:
                continue
            
            # Fetch all categories
            categories_list = []
            for cat_link in collection.categories:
                cat = await Category.get(cat_link.ref.id)
                if cat:
                    categories_list.append({"name": cat.name})
            
            # Filter by category if provided
            if category:
                if not any(cat["name"] == category for cat in categories_list):
                    continue
            
            # Build the collection data
            collection_data = {
                "id": collection.id,
                "title": collection.title,
                "description": collection.description,
                "status": collection.status,
                "created_at": collection.created_at,
                "updated_at": collection.updated_at,
                "created_by": created_by_user.model_dump(),
                "categories": categories_list,
                "questions": [],  # Required by schema but excluded from serialization
                "question_count": len(getattr(collection, "questions", []) or []),
            }
            
            result.append(CollectionQuestionCount.model_validate(collection_data))
        
        return result

    async def delete_question(self, question_id: str, user_id: str) -> None:
        """Delete an existing question by its ID."""
        question = await self.question_repository.get_by_id(
            question_id, fetch_fields={"collection": 1}
        )
        if not question:
            raise NotFoundError(_("Question not found"))

        if question.created_by.ref.id != user_id:
            raise ForbiddenError(_("You do not own this question"))

        await self.question_repository.delete(
            question_id, link_rule=DeleteRules.DELETE_LINKS
        )
