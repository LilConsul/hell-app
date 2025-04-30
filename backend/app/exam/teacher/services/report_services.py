import statistics
from datetime import datetime
from typing import List, Optional, Tuple

from app.core.exceptions import NotFoundError
from app.exam.models import StudentAttempt
from app.exam.repository import (
    ExamInstanceRepository,
    StudentAttemptRepository,
    StudentExamRepository,
)
from app.exam.teacher.schemas import (
    ExamReportFilter,
    ExamReportResponse,
    ExamStatistics,
    HistogramDataPoint,
    TimelineDataPoint,
)


class ReportService:
    def __init__(
        self,
        student_exam_repository: StudentExamRepository,
        student_attempt_repository: StudentAttemptRepository,
        exam_instance_repository: ExamInstanceRepository,
    ):
        self.student_exam_repository = student_exam_repository
        self.student_attempt_repository = student_attempt_repository
        self.exam_instance_repository = exam_instance_repository

    async def get_exam_report(
        self,
        exam_instance_id: str,
        filters: ExamReportFilter,
    ) -> ExamReportResponse:
        """
        Get comprehensive report for an exam instance including all metrics.

        Args:
            exam_instance_id: The ID of the exam instance
            filters: Filters for the report data

        Returns:
            Dictionary containing all report metrics
        """
        exam_instance = await self.exam_instance_repository.get_by_id(
            exam_instance_id, fetch_links=True
        )
        if not exam_instance:
            raise NotFoundError("Exam instance not found")

        if filters.subject and filters.subject.lower() != exam_instance.title.lower():
            return ExamReportResponse(
                exam_title=exam_instance.title,
                total_students=0,
                attempts_count=0,
                statistics=ExamStatistics(),
            )

        date_range = (
            (filters.start_date, filters.end_date)
            if filters.start_date and filters.end_date
            else None
        )

        attempts = await self._get_filtered_attempts(
            exam_instance_id, date_range, filters.student_ids
        )

        if not attempts:
            return ExamReportResponse(
                exam_title=exam_instance.title,
                total_students=0,
                attempts_count=0,
                statistics=ExamStatistics(),
            )

        scores = [attempt.grade for attempt in attempts if attempt.grade is not None]

        passing_score = exam_instance.passing_score
        passing_students = sum(1 for score in scores if score >= passing_score)
        pass_rate = (passing_students / len(scores)) * 100 if scores else 0

        histogram_data = self._prepare_histogram_data(scores)

        timeline_data = self._prepare_timeline_data(attempts)

        return ExamReportResponse(
            exam_title=exam_instance.title,
            total_students=len(set(attempt.student_exam_id.id for attempt in attempts)),
            attempts_count=len(attempts),
            statistics=ExamStatistics(
                mean=statistics.mean(scores) if scores else None,
                median=statistics.median(scores) if scores else None,
                max=max(scores) if scores else None,
                min=min(scores) if scores else None,
            ),
            pass_rate=pass_rate,
            histogram_data=histogram_data,
            timeline_data=timeline_data,
        )

    async def _get_filtered_attempts(
        self,
        exam_instance_id: str,
        date_range: Optional[Tuple[datetime, datetime]] = None,
        student_ids: Optional[List[str]] = None,
    ) -> List[StudentAttempt]:
        """Helper method to get filtered student attempts"""
        student_exams = await self.student_exam_repository.get_all(
            {"exam_instance_id._id": exam_instance_id}, fetch_links=True
        )

        if student_ids:
            student_exams = [
                exam
                for exam in student_exams
                if str(exam.student_id.ref.id) in student_ids
            ]

        attempts = []
        for student_exam in student_exams:
            student_attempts = await self.student_attempt_repository.get_all(
                {"student_exam_id._id": student_exam.id}, fetch_links=True
            )

            if date_range:
                start_date, end_date = date_range
                student_attempts = [
                    attempt
                    for attempt in student_attempts
                    if attempt.submitted_at
                    and start_date <= attempt.submitted_at <= end_date
                ]

            attempts.extend(student_attempts)

        return [attempt for attempt in attempts if attempt.grade is not None]

    def _prepare_histogram_data(self, scores: List[float]) -> List[HistogramDataPoint]:
        """Helper method to prepare histogram data"""
        if not scores:
            return []

        # Create bins for scores (0-10, 11-20, etc.)
        bins = {}
        for i in range(0, 101, 10):
            bins[i] = 0

        for score in scores:
            bin_key = (int(score) // 10) * 10
            bins[bin_key] += 1

        return [
            HistogramDataPoint(range=f"{k}-{k + 9}", count=v) for k, v in bins.items()
        ]

    def _prepare_timeline_data(
        self, attempts: List[StudentAttempt]
    ) -> List[TimelineDataPoint]:
        """Helper method to prepare timeline data (scores over time)"""
        if not attempts:
            return []

        sorted_attempts = sorted(
            [a for a in attempts if a.submitted_at and a.grade is not None],
            key=lambda x: x.submitted_at,
        )

        timeline_data = {}
        for attempt in sorted_attempts:
            day = attempt.submitted_at.date().isoformat()
            if day not in timeline_data:
                timeline_data[day] = []
            timeline_data[day].append(attempt.grade)

        return [
            TimelineDataPoint(date=day, average_score=sum(scores) / len(scores))
            for day, scores in timeline_data.items()
        ]
