from typing import List

from app.exam.repository import StudentExamRepository
from app.exam.student.schemas import CreateStudentExamSchema


class StudentExamService:
    def __init__(
        self,
        student_exam_repository: StudentExamRepository,
    ):
        self.student_exam_repository = student_exam_repository

    async def get_student_exams(self, student_id: str) -> List[CreateStudentExamSchema]:
        """
        Get all exams for a student.
        """
        data = await self.student_exam_repository.get_all(
            {"student_id._id": student_id}, fetch_links=True
        )
        return [
            CreateStudentExamSchema.model_validate(
                {
                    **exam.model_dump(),
                    "exam_instance_id": exam.exam_instance_id.model_dump(),
                }
            )
            for exam in data
        ]

    async def get_student_exam(
        self, student_id: str, exam_id: str
    ) -> CreateStudentExamSchema:
        """
        Get a specific exam for a student.
        """
        data = await self.student_exam_repository.get_by_student_and_exam(
            student_id, exam_id, fetch_links=True
        )
        return CreateStudentExamSchema.model_validate(
            {
                **data.model_dump(),
                "exam_instance_id": data.exam_instance_id.model_dump(),
            }
        )

    async def start_exam(
        self, student_id: str, exam_id: str
    ) -> CreateStudentExamSchema:
        """
        Start an exam for a student.
        """
        pass
        # data = await self.student_exam_repository.start_exam(student_id, exam_id)
        # return BaseStudentExamSchema.model_validate(
        #     {
        #         **data.model_dump(),
        #         "exam_instance_id": data.exam_instance_id.model_dump(),
        #     }
        # )
