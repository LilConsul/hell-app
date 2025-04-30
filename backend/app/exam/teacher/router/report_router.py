from datetime import datetime
from typing import Optional

from app.auth.dependencies import get_current_teacher_id
from app.core.schemas import BaseReturn
from app.exam.teacher.dependencies import get_report_service
from app.exam.teacher.schemas import ExamReportFilter, ExamReportResponse
from app.exam.teacher.services import ReportService
from fastapi import APIRouter, Depends, Query

router = APIRouter(
    prefix="/report",
    dependencies=[Depends(get_current_teacher_id)],
)


@router.get("/{exam_instance_id}", response_model=BaseReturn[ExamReportResponse])
async def get_exam_report(
    exam_instance_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    group_ids: Optional[str] = Query(
        None, description="Comma-separated list of student IDs"
    ),
    subject: Optional[str] = None,
    report_service: ReportService = Depends(get_report_service),
):
    """
    Get comprehensive exam report with statistics, pass rate, and visualization data.
    Supports filtering by date range, student group, and subject (exam title).
    """
    # Parse group IDs if provided
    student_ids = group_ids.split(",") if group_ids else None

    # Create filter object for the service
    filters = ExamReportFilter(
        start_date=start_date,
        end_date=end_date,
        student_ids=student_ids,
        subject=subject,
    )

    report = await report_service.get_exam_report(
        exam_instance_id=exam_instance_id, filters=filters
    )

    return BaseReturn(message="Exam report retrieved successfully", data=report)
