from typing import List

from fastapi import APIRouter, Depends, status

from app.auth.dependencies import get_current_teacher_id
from app.core.schemas import BaseReturn
from app.exam.teacher.dependencies import get_collection_service
from app.exam.teacher.schemas import (CollectionQuestionCount,
                                      CreateCollection, GetCollection,
                                      QuestionOrderSchema, QuestionSchema,
                                      UpdateCollection, UpdateQuestionSchema)
from app.exam.teacher.services import CollectionService
from app.i18n import _

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
        message=_("Collection created successfully"),
        data={"collection_id": collection_id},
    )


@router.get("/", response_model=BaseReturn[List[CollectionQuestionCount]])
async def get_teacher_collections(
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Get all collections created by the current teacher"""
    collections = await collection_service.get_teacher_collections(teacher_id)
    return BaseReturn(
        message=_("Collections retrieved successfully"),
        data=collections,
    )


@router.get("/public", response_model=BaseReturn[List[CollectionQuestionCount]])
async def get_public_collections(
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Get all published collections that are publicly available"""
    collections = await collection_service.get_public_collections()
    return BaseReturn(
        message=_("Public collections retrieved successfully"),
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
        message=_("Collection retrieved successfully"),
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
        message=_("Collection updated successfully"),
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
        message=_("Collection deleted successfully"),
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
        message=_("Question added successfully"),
        data={"question_id": question_id},
    )

@router.post("/{collection_id}/questions/bulk")
async def add_bulk_questions_to_collection(
    collection_id: str,
    questions_data: List[QuestionSchema],
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Add multiple questions to a collection"""
    question_ids = await collection_service.add_question_to_collection_bulk(
        collection_id, teacher_id, questions_data
    )
    return BaseReturn(
        message=_("Questions added successfully"),
        data={"question_ids": question_ids},
    )


@router.post("/{collection_id}/questions/reorder")
async def reorder_questions(
    collection_id: str,
    question_ids: QuestionOrderSchema,
    teacher_id: str = Depends(get_current_teacher_id),
    collection_service: CollectionService = Depends(get_collection_service),
):
    """Reorder questions in a collection"""
    await collection_service.reorder_questions(collection_id, teacher_id, question_ids)
    return BaseReturn(
        message=_("Questions reordered successfully"),
        data={"collection_id": collection_id},
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
        message=_("Question updated successfully"),
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
        message=_("Question deleted successfully"),
        data={"collection_id": collection_id, "question_id": question_id},
    )
