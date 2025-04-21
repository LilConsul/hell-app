from typing import List

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_teacher_id
from app.core.schemas import BaseReturn
from app.exam.teacher.dependencies import get_exam_instance_service
from app.exam.teacher.schemas import (
    CreateExamInstanceSchema,
    GetExamInstance,
    UpdateExamInstanceSchema,
)
from app.exam.teacher.services import ExamInstanceService

router = APIRouter(
    prefix="/exam-instances",
    dependencies=[Depends(get_current_teacher_id)],
)


@router.get("/", response_model=BaseReturn[List[GetExamInstance]])
async def get_teacher_exam_instances(
    user_id: str = Depends(get_current_teacher_id),
    instance_service: ExamInstanceService = Depends(get_exam_instance_service),
):
    instances = await instance_service.get_by_creator(user_id)
    return BaseReturn(message="Exam instances retrieved successfully", data=instances)


@router.post("/", response_model=BaseReturn[str])
async def create_exam_instance(
    instance_data: CreateExamInstanceSchema,
    user_id: str = Depends(get_current_teacher_id),
    instance_service: ExamInstanceService = Depends(get_exam_instance_service),
):
    instance_id = await instance_service.create_exam_instance(user_id, instance_data)
    return BaseReturn(message="Exam instance created successfully", data=instance_id)


@router.get("/{instance_id}", response_model=BaseReturn[GetExamInstance])
async def get_exam_instance(
    instance_id: str,
    user_id: str = Depends(get_current_teacher_id),
    instance_service: ExamInstanceService = Depends(get_exam_instance_service),
):
    instance = await instance_service.get_by_id(user_id, instance_id)
    if not instance:
        return BaseReturn(message="Exam instance not found", data=None)
    return BaseReturn(message="Exam instance retrieved successfully", data=instance)


@router.delete("/{instance_id}", response_model=BaseReturn[str])
async def delete_exam_instance(
    instance_id: str,
    user_id: str = Depends(get_current_teacher_id),
    instance_service: ExamInstanceService = Depends(get_exam_instance_service),
):
    await instance_service.delete_exam_instance(user_id, instance_id)
    return BaseReturn(message="Exam instance deleted successfully", data=instance_id)


@router.put("/{instance_id}", response_model=BaseReturn[str])
async def update_exam_instance(
    instance_id: str,
    instance_data: UpdateExamInstanceSchema,
    user_id: str = Depends(get_current_teacher_id),
    instance_service: ExamInstanceService = Depends(get_exam_instance_service),
):
    await instance_service.update_exam_instance(user_id, instance_id, instance_data)
    return BaseReturn(message="Exam instance updated successfully", data=instance_id)
