from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, Response

from app.auth.dependencies import get_current_teacher_id
from app.core.schemas import BaseReturn
from app.core.utils import get_timezone
from app.exam.teacher.dependencies import get_report_service
from app.exam.teacher.schemas import ExamReportFilter, ExamReportResponse
from app.exam.teacher.services import ReportService
from app.i18n import _

router = APIRouter(
    prefix="/report",
    dependencies=[Depends(get_current_teacher_id)],
)


@router.get("/{exam_instance_id}", response_model=BaseReturn[ExamReportResponse])
async def get_exam_report(
    exam_instance_id: str,
    start_date: Optional[datetime] = Query(
        None, description="Date from which search on submitted attempts starts"
    ),
    end_date: Optional[datetime] = Query(
        None, description="Date until which search on submitted attempts ends"
    ),
    student_ids: Optional[str] = Query(
        None, description="Comma-separated list of student IDs"
    ),
    only_last_attempt: Optional[bool] = True,
    report_service: ReportService = Depends(get_report_service),
    request: Request = None,
):
    """
    Get comprehensive exam report with statistics, pass rate, and visualization data.
    Supports filtering by date range, student group, and subject (exam title).
    """
    user_timezone = get_timezone(request)
    # Parse group IDs if provided
    student_ids = student_ids.split(",") if student_ids else None

    # Create filter object for the service
    filters = ExamReportFilter(
        start_date=start_date,
        end_date=end_date,
        student_ids=student_ids,
        only_last_attempt=only_last_attempt,
    )

    report = await report_service.get_exam_report(
        exam_instance_id=exam_instance_id, filters=filters, user_timezone=user_timezone
    )

    return BaseReturn(message=_("Exam report retrieved successfully"), data=report)


@router.get("/{exam_instance_id}/export-pdf", response_class=Response)
async def export_exam_report_pdf(
    exam_instance_id: str,
    start_date: Optional[datetime] = Query(
        None, description="Date from which search on submitted attempts starts"
    ),
    end_date: Optional[datetime] = Query(
        None, description="Date until which search on submitted attempts ends"
    ),
    student_ids: Optional[str] = Query(
        None, description="Comma-separated list of student IDs"
    ),
    only_last_attempt: Optional[bool] = True,
    include_visualizations: bool = True,
    report_service: ReportService = Depends(get_report_service),
    request: Request = None,
):
    """
    Export exam report as PDF with statistics, visualizations, and student performance breakdown.
    Includes timeline and histogram charts when include_visualizations is True.
    When only_last_attempt is False, all attempts for each student are grouped together.
    """
    user_timezone = get_timezone(request)
    # Parse student IDs if provided
    student_ids = student_ids.split(",") if student_ids else None

    # Create filter object for the service
    filters = ExamReportFilter(
        start_date=start_date,
        end_date=end_date,
        student_ids=student_ids,
        only_last_attempt=only_last_attempt,
    )

    # Generate the PDF with visualization options
    pdf_content = await report_service.generate_exam_report_pdf(
        exam_instance_id=exam_instance_id,
        filters=filters,
        include_visualizations=include_visualizations,
        user_timezone=user_timezone,
    )

    # Create a downloadable response
    headers = {
        "Content-Disposition": f"attachment; filename=exam_report_{exam_instance_id}.pdf",
        "Content-Type": "application/pdf",
    }

    return Response(content=pdf_content, headers=headers, media_type="application/pdf")
