import statistics
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

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
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


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

        if filters.title and filters.title.lower() != exam_instance.title.lower():
            return ExamReportResponse(
                exam_title=exam_instance.title,
                total_students=0,
                attempts_count=0,
                statistics=ExamStatistics(),
            )

        start_date = (
            filters.start_date if filters.start_date else exam_instance.start_date
        )
        if start_date and start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)

        end_date = filters.end_date if filters.end_date else datetime.now(timezone.utc)
        if end_date and end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)

        date_range = (start_date, end_date)

        attempts = await self._get_filtered_attempts(
            exam_instance_id, date_range, filters.student_ids, filters.only_last_attempt
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
        only_last_attempt: bool = True,
    ) -> List[StudentAttempt]:
        """
        Helper method to get filtered student attempts

        Args:
            exam_instance_id: ID of the exam instance
            date_range: Optional tuple of (start_date, end_date) to filter by submission time
            student_ids: Optional list of student IDs to filter by
            only_last_attempt: If True, include only the last attempt for each student

        Returns:
            Filtered list of student attempts
        """
        student_exams = await self.student_exam_repository.get_all(
            {"exam_instance_id._id": exam_instance_id}, fetch_links=True
        )

        if student_ids:
            student_exams = [
                exam for exam in student_exams if str(exam.student_id.id) in student_ids
            ]

        all_attempts = []
        for student_exam in student_exams:
            student_attempts = await self.student_attempt_repository.get_all(
                {"student_exam_id._id": student_exam.id}, fetch_links=True
            )

            if date_range:
                start_date, end_date = date_range
                filtered_attempts = []
                for attempt in student_attempts:
                    if attempt.submitted_at:
                        # Ensure attempt.submitted_at is timezone-aware
                        submitted_at = attempt.submitted_at
                        if submitted_at.tzinfo is None:
                            submitted_at = submitted_at.replace(tzinfo=timezone.utc)

                        if start_date <= submitted_at <= end_date:
                            filtered_attempts.append(attempt)
                student_attempts = filtered_attempts

            student_attempts = [a for a in student_attempts if a.grade is not None]

            if only_last_attempt and student_attempts:
                last_attempt = max(
                    student_attempts,
                    key=lambda a: a.submitted_at if a.submitted_at else datetime.min,
                )
                all_attempts.append(last_attempt)
            else:
                all_attempts.extend(student_attempts)

        return all_attempts

    def _prepare_histogram_data(self, scores: List[float]) -> List[HistogramDataPoint]:
        """Helper method to prepare histogram data for percentage scores (0-100%)"""
        if not scores:
            return []

        # Create bins for scores (0-9, 10-19, ..., 90-100)
        bins = {}
        for i in range(0, 100, 10):
            bins[i] = 0

        for score in scores:
            # Special handling for score of exactly 100%
            if score == 100:
                bin_key = 90  # Put 100% in the 90-100 bin
            else:
                bin_key = (int(score) // 10) * 10
            bins[bin_key] += 1

        # Create histogram data points with special handling for last bin
        result = []
        for k, v in bins.items():
            if k == 90:
                range_str = "90-100"  # Last bin includes 100%
            else:
                range_str = f"{k}-{k + 9}"
            result.append(HistogramDataPoint(range=range_str, count=v))

        return result

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

    async def get_student_report_data(
        self,
        exam_instance_id: str,
        filters: ExamReportFilter,
    ) -> List[Dict[str, Any]]:
        """Get individual student performance data for the report."""
        student_data = []

        # Get all attempts filtered by the criteria
        attempts = await self._get_filtered_attempts(
            exam_instance_id,
            (filters.start_date, filters.end_date)
            if filters.start_date and filters.end_date
            else None,
            filters.student_ids,
            filters.only_last_attempt,
        )

        # Process each attempt to get student information
        for attempt in attempts:
            if attempt.grade is not None:
                student_exam = attempt.student_exam_id
                student = student_exam.student_id

                student_data.append(
                    {
                        "name": f"{student.first_name} {student.last_name}",
                        "email": student.email,
                        "score": attempt.grade,
                        "status": attempt.pass_fail,
                        "attempt_date": attempt.submitted_at.strftime("%Y-%m-%d %H:%M")
                        if attempt.submitted_at
                        else "N/A",
                    }
                )

        # Sort by student name
        student_data.sort(key=lambda x: x["name"])

        return student_data

    async def generate_exam_report_pdf(
        self,
        exam_instance_id: str,
        filters: ExamReportFilter,
        include_visualizations: bool = True,
    ) -> bytes:
        """Generate a PDF report for an exam instance."""
        # Get the report data
        report_data = await self.get_exam_report(
            exam_instance_id=exam_instance_id, filters=filters
        )

        # Get student-specific data
        student_data = await self.get_student_report_data(
            exam_instance_id=exam_instance_id, filters=filters
        )

        # Create a buffer for the PDF content
        buffer = BytesIO()

        # Set up the document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
        )

        # Get styles
        styles = getSampleStyleSheet()
        title_style = styles["Title"]
        heading_style = styles["Heading2"]
        normal_style = styles["Normal"]

        # Create story (content elements)
        story = []

        # Add title
        story.append(Paragraph(f"Exam Report: {report_data.exam_title}", title_style))
        story.append(Spacer(1, 0.25 * inch))

        # Add date
        current_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        story.append(Paragraph(f"Generated on: {current_date}", normal_style))
        story.append(Spacer(1, 0.25 * inch))

        # Add summary statistics
        story.append(Paragraph("Summary Statistics", heading_style))

        # Create a summary table
        summary_data = [
            [
                "Total Students",
                "Attempts",
                "Average",
                "Median",
                "Min",
                "Max",
                "Pass Rate",
            ],
            [
                str(report_data.total_students),
                str(report_data.attempts_count),
                f"{report_data.statistics.mean:.1f}"
                if report_data.statistics.mean is not None
                else "N/A",
                f"{report_data.statistics.median:.1f}"
                if report_data.statistics.median is not None
                else "N/A",
                f"{report_data.statistics.min:.1f}"
                if report_data.statistics.min is not None
                else "N/A",
                f"{report_data.statistics.max:.1f}"
                if report_data.statistics.max is not None
                else "N/A",
                f"{report_data.pass_rate:.1f}%"
                if report_data.pass_rate is not None
                else "N/A",
            ],
        ]

        summary_table = Table(summary_data, colWidths=[doc.width / 7.0] * 7)
        summary_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        story.append(summary_table)
        story.append(Spacer(1, 0.5 * inch))

        # Add visualizations if requested
        if (
            include_visualizations
            and report_data.histogram_data
            and report_data.timeline_data
        ):
            # Add histogram
            story.append(Paragraph("Score Distribution", heading_style))

            # Create histogram data for chart
            from reportlab.graphics.charts.barcharts import VerticalBarChart
            from reportlab.graphics.shapes import Drawing

            histogram_drawing = Drawing(500, 200)
            histogram_chart = VerticalBarChart()
            histogram_chart.x = 50
            histogram_chart.y = 50
            histogram_chart.height = 125
            histogram_chart.width = 400

            # Extract data from histogram_data
            histogram_ranges = [h.range for h in report_data.histogram_data]
            histogram_counts = [h.count for h in report_data.histogram_data]

            histogram_chart.data = [histogram_counts]
            histogram_chart.categoryAxis.categoryNames = histogram_ranges
            histogram_chart.categoryAxis.labels.boxAnchor = "ne"
            histogram_chart.categoryAxis.labels.angle = 30
            histogram_chart.bars[0].fillColor = colors.steelblue

            histogram_drawing.add(histogram_chart)
            story.append(histogram_drawing)
            story.append(Spacer(1, 0.25 * inch))

            # Add timeline chart
            story.append(Paragraph("Performance Over Time", heading_style))

            from reportlab.graphics.charts.lineplots import LinePlot

            timeline_drawing = Drawing(500, 200)
            timeline_chart = LinePlot()
            timeline_chart.x = 50
            timeline_chart.y = 50
            timeline_chart.height = 125
            timeline_chart.width = 400

            # Extract data from timeline_data
            timeline_dates = [t.date for t in report_data.timeline_data]
            timeline_scores = [
                (i, t.average_score) for i, t in enumerate(report_data.timeline_data)
            ]

            timeline_chart.data = [timeline_scores]
            timeline_chart.lines[0].strokeColor = colors.green

            # X-axis labels
            timeline_chart.xValueAxis.valueMin = 0
            timeline_chart.xValueAxis.valueMax = len(timeline_dates) - 1
            timeline_chart.xValueAxis.valueSteps = list(range(len(timeline_dates)))
            timeline_chart.xValueAxis.labelTextFormat = (
                lambda x: timeline_dates[int(x)] if x < len(timeline_dates) else ""
            )

            timeline_drawing.add(timeline_chart)
            story.append(timeline_drawing)
            story.append(Spacer(1, 0.5 * inch))

        # Add student performance breakdown
        story.append(Paragraph("Student Performance", heading_style))

        # Special handling for multiple attempts
        if not filters.only_last_attempt and student_data:
            # Group student data by student email
            student_groups = {}
            for student in student_data:
                email = student["email"]
                if email not in student_groups:
                    student_groups[email] = []
                student_groups[email].append(student)

            # Create a table for each student with all their attempts
            for email, attempts in student_groups.items():
                # Sort attempts by date
                attempts.sort(key=lambda x: x["attempt_date"], reverse=True)

                # Add student name header
                student_name = attempts[0]["name"]
                story.append(
                    Paragraph(f"Student: {student_name} ({email})", styles["Heading4"])
                )

                # Create table with all attempts
                attempt_table_data = [["Attempt #", "Score", "Status", "Date"]]

                for i, attempt in enumerate(attempts, 1):
                    attempt_table_data.append(
                        [
                            f"Attempt {i}",
                            f"{attempt['score']:.1f}"
                            if attempt["score"] is not None
                            else "N/A",
                            attempt["status"].value if attempt["status"] else "N/A",
                            attempt["attempt_date"],
                        ]
                    )

                # Create and style the attempt table
                attempt_table = Table(attempt_table_data)
                attempt_table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            (
                                "BACKGROUND",
                                (0, 1),
                                (-1, 1),
                                colors.lightblue,
                            ),  # Highlight latest attempt
                            ("GRID", (0, 0), (-1, -1), 1, colors.black),
                        ]
                    )
                )

                story.append(attempt_table)
                story.append(Spacer(1, 0.25 * inch))
        else:
            # Original single attempt per student code
            if student_data:
                student_table_data = [
                    ["Student Name", "Email", "Score", "Status", "Attempt Date"]
                ]

                for student in student_data:
                    student_table_data.append(
                        [
                            student["name"],
                            student["email"],
                            f"{student['score']:.1f}"
                            if student["score"] is not None
                            else "N/A",
                            student["status"].value if student["status"] else "N/A",
                            student["attempt_date"],
                        ]
                    )

                student_table = Table(
                    student_table_data, colWidths=[doc.width / 5.0] * 5
                )
                student_table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                            ("GRID", (0, 0), (-1, -1), 1, colors.black),
                        ]
                    )
                )

                story.append(student_table)
            else:
                story.append(
                    Paragraph(
                        "No student data available for the selected filters.",
                        normal_style,
                    )
                )

        # Generate the PDF
        doc.build(story)

        # Get the PDF content
        pdf_content = buffer.getvalue()
        buffer.close()

        return pdf_content
