from typing import List

from app.auth.dependencies import get_current_teacher_id
from app.core.schemas import BaseReturn
from app.exam.teacher.dependencies import get_collection_service
from app.exam.teacher.schemas import (
    CreateCollection,
    GetCollection,
    QuestionSchema,
    UpdateCollection,
    JustCollection,
    UpdateQuestionSchema,
)
from app.exam.teacher.services import CollectionService
from fastapi import APIRouter, Depends, status

router = APIRouter(
    prefix="/collections",
    dependencies=[Depends(get_current_teacher_id)],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection_data: CreateCollection,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Create a new question collection"""
    collection_id = await collection_service.create_collection(
        collection_data, teacher_id
    )
    return BaseReturn(
        message="Collection created successfully",
        data={"collection_id": collection_id},
    )


@router.get("/", response_model=BaseReturn[List[JustCollection]])
async def get_teacher_collections(
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Get all collections created by the current teacher"""
    collections = await collection_service.get_teacher_collections(teacher_id)
    return BaseReturn(
        message="Collections retrieved successfully",
        data=collections,
    )


@router.get("/public", response_model=BaseReturn[List[JustCollection]])
async def get_public_collections(
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Get all published collections that are publicly available"""
    collections = await collection_service.get_public_collections()
    return BaseReturn(
        message="Public collections retrieved successfully",
        data=collections,
    )


@router.get("/{collection_id}", response_model=BaseReturn[GetCollection])
async def get_collection(
    collection_id: str,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Get a collection by ID with its questions"""
    collection = await collection_service.get_collection(teacher_id, collection_id)
    return BaseReturn(
        message="Collection retrieved successfully",
        data=collection,
    )


@router.put("/{collection_id}", response_model=BaseReturn)
async def update_collection(
    collection_id: str,
    collection_data: UpdateCollection,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Update a collection by ID"""
    await collection_service.update_collection(
        collection_id, teacher_id, collection_data
    )
    return BaseReturn(
        message="Collection updated successfully",
    )


@router.delete("/{collection_id}", response_model=BaseReturn)
async def delete_collection(
    collection_id: str,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Delete a collection by ID"""
    await collection_service.delete_collection(collection_id, teacher_id)
    return BaseReturn(
        message="Collection deleted successfully",
    )


@router.post("/{collection_id}/questions")
async def add_question_to_collection(
    collection_id: str,
    question_data: QuestionSchema,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Add a question to a collection"""
    question_id = await collection_service.add_question_to_collection(
        collection_id, teacher_id, question_data
    )
    return BaseReturn(
        message="Question added successfully",
        data={"question_id": question_id},
    )


@router.put("/{collection_id}/questions/{question_id}", response_model=BaseReturn)
async def edit_question(
    collection_id: str,
    question_id: str,
    question_data: UpdateQuestionSchema,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Edit a question by its ID"""
    await collection_service.edit_question(question_id, teacher_id, question_data)
    return BaseReturn(
        message="Question updated successfully",
        data={"collection_id": collection_id, "question_id": question_id},
    )


@router.delete("/{collection_id}/questions/{question_id}", response_model=BaseReturn)
async def delete_question(
    collection_id: str,
    question_id: str,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Delete a question by its ID"""
    await collection_service.delete_question(question_id, teacher_id)
    return BaseReturn(
        message="Question deleted successfully",
        data={"collection_id": collection_id, "question_id": question_id},
    )