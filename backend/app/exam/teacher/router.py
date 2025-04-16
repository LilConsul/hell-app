from app.auth.dependencies import get_current_teacher_id
from app.exam.teacher.dependencies import get_collection_service
from app.exam.teacher.schemas import CreateCollection, GetCollection, QuestionSchema
from app.exam.teacher.services import CollectionService
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(
    prefix="/teacher",
    tags=["exam/teacher"],
    dependencies=[Depends(get_current_teacher_id)],
)


@router.post("/collections", status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection_data: CreateCollection,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Create a new question collection"""
    collection_id = await collection_service.create_collection(
        collection_data, teacher_id
    )
    return {"id": collection_id, "message": "Collection created successfully"}


@router.get("/collections/{collection_id}", response_model=GetCollection)
async def get_collection(
    collection_id: str,
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Get a collection by ID with its questions"""
    return await collection_service.get_collection(collection_id)


@router.post("/collections/{collection_id}/questions")
async def add_question_to_collection(
    collection_id: str,
    question_data: QuestionSchema,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Add a question to a collection"""
    await collection_service.add_question_to_collection(
        collection_id, teacher_id, question_data
    )
    return {"message": "Question added successfully"}
