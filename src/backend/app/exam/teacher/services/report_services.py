import statistics
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.exceptions import NotFoundError
from app.core.utils import convert_to_user_timezone, convert_user_timezone_to_utc
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
from app.i18n import _


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
        user_timezone=None,
    ) -> ExamReportResponse:
        """
        Get comprehensive report for an exam instance including all metrics.

        Args:
            exam_instance_id: The ID of the exam instance
            filters: Filters for the report data

        Returns:
            Dictionary containing all report metrics
        """
        exam_instance = await self.exam_instance_repository.get_by_id(exam_instance_id)
        if not exam_instance:
            raise NotFoundError(_("Exam instance not found"))


        # Convert filter dates from user timezone to UTC
        start_date = filters.start_date if filters.start_date else None
        if start_date and user_timezone:
            start_date = convert_user_timezone_to_utc(start_date, user_timezone)
        elif start_date and start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)

        end_date = filters.end_date if filters.end_date else None
        if end_date and user_timezone:
            end_date = convert_user_timezone_to_utc(end_date, user_timezone)
        elif end_date and end_date.tzinfo is None:
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

        # Convert timeline timestamps to user timezone
        timeline_data = self._prepare_timeline_data(attempts)
        if user_timezone and timeline_data:
            for point in timeline_data:
                # Convert the datetime object from ISO format string
                date_obj = datetime.fromisoformat(point.date)
                if date_obj.tzinfo is None:
                    date_obj = date_obj.replace(tzinfo=timezone.utc)
                # Convert to user timezone and update the date string
                date_obj = convert_to_user_timezone(date_obj, user_timezone)
                point.date = date_obj.date().isoformat()

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
            {"exam_instance_id.$id": exam_instance_id},
            fetch_fields={"attempts": 2, "student_id": 1},
        )
        if student_ids:
            student_exams = [
                exam for exam in student_exams if str(exam.student_id.id) in student_ids
            ]
        all_attempts = []
        for student_exam in student_exams:
            student_attempts = student_exam.attempts

            if date_range:
                start_date, end_date = date_range
                filtered_attempts = []
                for attempt in student_attempts:
                    if attempt.submitted_at:
                        # Ensure attempt.submitted_at is timezone-aware
                        submitted_at = attempt.submitted_at
                        if submitted_at.tzinfo is None:
                            submitted_at = submitted_at.replace(tzinfo=timezone.utc)

                        # Check start_date and end_date separately
                        # This allows flexibility when either start_date or end_date is not specified
                        is_within_range = True
                        if start_date and submitted_at < start_date:
                            is_within_range = False
                        if end_date and submitted_at > end_date:
                            is_within_range = False

                        if is_within_range:
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
                student = await student_exam.student_id.fetch()

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
        user_timezone=None,
    ) -> bytes:
        """Generate a modern PDF report for an exam instance with shadcn inspired design."""
        # Get the report data
        report_data = await self.get_exam_report(
            exam_instance_id=exam_instance_id,
            filters=filters,
            user_timezone=user_timezone,
        )

        # Get student-specific data
        student_data = await self.get_student_report_data(
            exam_instance_id=exam_instance_id, filters=filters
        )

        # Create a buffer for the PDF content
        buffer = BytesIO()

        # Set up the document with PORTRAIT A4 format (changed from landscape)
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,  # Changed to portrait A4
            rightMargin=40,
            leftMargin=40,
            topMargin=50,
            bottomMargin=40,
        )

        # Shadcn-inspired neutral color palette
        primary_color = colors.HexColor("#18181B")  # zinc-900
        secondary_color = colors.HexColor("#71717A")  # zinc-500
        accent_color = colors.HexColor("#3F3F46")  # zinc-700
        background_color = colors.HexColor("#F4F4F5")  # zinc-100
        muted_color = colors.HexColor("#E4E4E7")  # zinc-200
        border_color = colors.HexColor("#D4D4D8")  # zinc-300
        text_color = colors.HexColor("#27272A")  # zinc-800
        success_color = colors.HexColor("#16A34A")  # green-600
        error_color = colors.HexColor("#DC2626")  # red-600

        # Get styles and customize for shadcn look
        styles = getSampleStyleSheet()
        title_style = styles["Title"]
        title_style.textColor = primary_color
        title_style.fontSize = 22
        title_style.fontName = "Helvetica-Bold"
        title_style.spaceAfter = 8

        heading_style = styles["Heading2"]
        heading_style.textColor = primary_color
        heading_style.fontSize = 16
        heading_style.fontName = "Helvetica-Bold"
        heading_style.spaceAfter = 8

        normal_style = styles["Normal"]
        normal_style.textColor = text_color
        normal_style.fontSize = 10
        normal_style.fontName = "Helvetica"

        subheading_style = styles["Heading4"]
        subheading_style.textColor = accent_color
        subheading_style.fontSize = 12
        subheading_style.fontName = "Helvetica-Bold"

        # White title style specifically for the exam title
        white_title_style = styles["Title"].clone("WhiteTitle")
        white_title_style.textColor = colors.white
        white_title_style.fontSize = 18
        white_title_style.fontName = "Helvetica-Bold"
        white_title_style.alignment = 1  # Center alignment

        # Create story (content elements)
        story = []

        generation_date = datetime.now(timezone.utc)
        if user_timezone:
            generation_date = convert_to_user_timezone(generation_date, user_timezone)
        # Create modern header
        header_data = [
            [
                Paragraph("<b>EXAM REPORT</b>", title_style),
                Paragraph(
                    f"<i>Generated: {generation_date.strftime('%Y-%m-%d')}</i>",
                    normal_style,
                ),
            ]
        ]
        header_table = Table(header_data, colWidths=[doc.width / 2.0] * 2)
        header_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.white),
                    ("TEXTCOLOR", (0, 0), (-1, 0), text_color),
                    ("ALIGN", (0, 0), (0, 0), "LEFT"),
                    ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                    ("LINEBELOW", (0, 0), (-1, 0), 1, border_color),
                    ("TOPPADDING", (0, 0), (-1, 0), 16),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 16),
                ]
            )
        )
        story.append(header_table)
        story.append(Spacer(1, 20))

        # Add exam title in a modern card with white text centered
        title_text = f"{report_data.exam_title}"
        title_table = Table(
            [[Paragraph(title_text, white_title_style)]], colWidths=[doc.width]
        )
        title_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), primary_color),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("PADDING", (0, 0), (-1, -1), 28),  # Taller rectangle
                    ("ROUNDEDCORNERS", [6, 6, 6, 6]),
                ]
            )
        )
        story.append(title_table)
        story.append(Spacer(1, 20))

        # Add summary statistics in shadcn card style
        story.append(Paragraph("Summary Statistics", heading_style))
        story.append(Spacer(1, 8))

        # Adjust for portrait mode - use 3 rows of stats instead of 1 row
        summary_data = [
            [
                "Total Students",
                str(report_data.total_students),
                "Attempts",
                str(report_data.attempts_count),
            ],
            [
                "Average",
                f"{report_data.statistics.mean:.1f}"
                if report_data.statistics.mean is not None
                else "N/A",
                "Median",
                f"{report_data.statistics.median:.1f}"
                if report_data.statistics.median is not None
                else "N/A",
            ],
            [
                "Min",
                f"{report_data.statistics.min:.1f}"
                if report_data.statistics.min is not None
                else "N/A",
                "Max",
                f"{report_data.statistics.max:.1f}"
                if report_data.statistics.max is not None
                else "N/A",
            ],
            [
                "Pass Rate",
                f"{report_data.pass_rate:.1f}%"
                if report_data.pass_rate is not None
                else "N/A",
                "",
                "",
            ],
        ]

        available_width = doc.width
        col_width = available_width / 4.0
        summary_table = Table(summary_data, colWidths=[col_width] * 4)
        summary_table.setStyle(
            TableStyle(
                [
                    # Label columns (0, 2)
                    ("BACKGROUND", (0, 0), (0, -1), background_color),
                    ("BACKGROUND", (2, 0), (2, -2), background_color),
                    ("TEXTCOLOR", (0, 0), (0, -1), primary_color),
                    ("TEXTCOLOR", (2, 0), (2, -2), primary_color),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (2, 0), (2, -2), "Helvetica-Bold"),
                    # Value columns (1, 3)
                    ("ALIGN", (1, 0), (1, -1), "LEFT"),
                    ("ALIGN", (3, 0), (3, -1), "LEFT"),
                    # All cells
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("LEFTPADDING", (0, 0), (-1, -1), 15),
                    # Borders
                    ("BOX", (0, 0), (-1, -1), 1, border_color),
                    ("ROUNDEDCORNERS", [4, 4, 4, 4]),
                    # Specific for pass rate row
                    ("SPAN", (1, 3), (3, 3)),  # Span the last row
                    ("BACKGROUND", (0, 3), (0, 3), background_color),
                ]
            )
        )
        story.append(summary_table)
        story.append(Spacer(1, 20))

        # Add visualizations if requested
        if (
            include_visualizations
            and report_data.histogram_data
            and report_data.timeline_data
        ):
            # Add section divider
            story.append(Paragraph("Data Visualizations", heading_style))
            story.append(Spacer(1, 8))

            # Create histogram with title inside the rectangle
            from reportlab.graphics.charts.barcharts import VerticalBarChart
            from reportlab.graphics.shapes import Drawing, Rect, String

            # Create drawing with background - adjusted for portrait
            histogram_drawing = Drawing(500, 220)

            # Add background rectangle with rounded corners
            bg_rect = Rect(0, 0, 500, 220, rx=6, ry=6)
            bg_rect.fillColor = colors.white
            bg_rect.strokeColor = border_color
            bg_rect.strokeWidth = 1
            histogram_drawing.add(bg_rect)

            # Add title inside the rectangle
            title_string = String(250, 200, "Score Distribution", textAnchor="middle")
            title_string.fontName = "Helvetica-Bold"
            title_string.fontSize = 12
            title_string.fillColor = accent_color
            histogram_drawing.add(title_string)

            histogram_chart = VerticalBarChart()
            histogram_chart.x = 50
            histogram_chart.y = 30  # Lower to make room for title
            histogram_chart.height = 125
            histogram_chart.width = 380  # Narrower chart for portrait

            # Extract data from histogram_data
            histogram_ranges = [h.range for h in report_data.histogram_data]
            histogram_counts = [h.count for h in report_data.histogram_data]

            histogram_chart.data = [histogram_counts]
            histogram_chart.categoryAxis.categoryNames = histogram_ranges
            histogram_chart.categoryAxis.labels.boxAnchor = "ne"
            histogram_chart.categoryAxis.labels.angle = 30
            histogram_chart.valueAxis.visibleGrid = True
            histogram_chart.valueAxis.gridStrokeColor = border_color
            histogram_chart.valueAxis.gridStrokeWidth = 0.5

            # Shadcn-inspired color styling
            histogram_chart.bars[0].fillColor = accent_color

            histogram_drawing.add(histogram_chart)
            story.append(histogram_drawing)
            story.append(Spacer(1, 16))

            # Create timeline chart with title inside rectangle
            from reportlab.graphics.charts.lineplots import LinePlot
            from reportlab.graphics.widgets.markers import makeMarker

            # Create drawing with background - adjusted for portrait
            timeline_drawing = Drawing(500, 220)

            # Add background rectangle with rounded corners
            bg_rect = Rect(0, 0, 500, 220, rx=6, ry=6)
            bg_rect.fillColor = colors.white
            bg_rect.strokeColor = border_color
            bg_rect.strokeWidth = 1
            timeline_drawing.add(bg_rect)

            # Add title inside the rectangle
            title_string = String(
                250, 200, "Performance Over Time", textAnchor="middle"
            )
            title_string.fontName = "Helvetica-Bold"
            title_string.fontSize = 12
            title_string.fillColor = accent_color
            timeline_drawing.add(title_string)

            timeline_chart = LinePlot()
            timeline_chart.x = 50
            timeline_chart.y = 30  # Lower to make room for title
            timeline_chart.height = 125
            timeline_chart.width = 380  # Narrower chart for portrait

            # Extract data from timeline_data
            timeline_dates = [t.date for t in report_data.timeline_data]
            timeline_scores = [
                (i, t.average_score) for i, t in enumerate(report_data.timeline_data)
            ]

            timeline_chart.data = [timeline_scores]
            timeline_chart.lines[0].strokeColor = primary_color
            timeline_chart.lines[0].strokeWidth = 2
            timeline_chart.lines[0].symbol = makeMarker("FilledCircle")
            timeline_chart.lines[0].symbol.fillColor = primary_color
            timeline_chart.lines[0].symbol.size = 4

            # Add grid lines
            timeline_chart.xValueAxis.visibleGrid = True
            timeline_chart.xValueAxis.gridStrokeColor = border_color
            timeline_chart.xValueAxis.gridStrokeWidth = 0.5
            timeline_chart.yValueAxis.visibleGrid = True
            timeline_chart.yValueAxis.gridStrokeColor = border_color
            timeline_chart.yValueAxis.gridStrokeWidth = 0.5

            # X-axis labels
            timeline_chart.xValueAxis.valueMin = 0
            timeline_chart.xValueAxis.valueMax = len(timeline_dates) - 1
            timeline_chart.xValueAxis.valueSteps = list(range(len(timeline_dates)))
            timeline_chart.xValueAxis.labelTextFormat = (
                lambda x: timeline_dates[int(x)] if x < len(timeline_dates) else ""
            )

            timeline_drawing.add(timeline_chart)
            story.append(timeline_drawing)
            story.append(Spacer(1, 20))

        # Add student performance breakdown - adjusted for portrait mode
        story.append(Paragraph("Student Performance", heading_style))
        story.append(Spacer(1, 8))

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
                student_header = Paragraph(
                    f"<b>{student_name}</b> ({email})", subheading_style
                )
                story.append(student_header)
                story.append(Spacer(1, 4))

                # Create table with all attempts - adjusted for portrait
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

                # Adjusted column widths for portrait
                col_widths = [available_width * w for w in [0.15, 0.15, 0.3, 0.4]]
                attempt_table = Table(attempt_table_data, colWidths=col_widths)

                # Apply modern shadcn-inspired styling
                table_style = [
                    # Header row
                    ("BACKGROUND", (0, 0), (-1, 0), background_color),
                    ("TEXTCOLOR", (0, 0), (-1, 0), primary_color),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                    ("TOPPADDING", (0, 0), (-1, 0), 10),
                    # Borders and lines
                    ("BOX", (0, 0), (-1, -1), 1, border_color),
                    ("LINEBELOW", (0, 0), (-1, 0), 1, border_color),
                    # Data rows
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
                    ("TOPPADDING", (0, 1), (-1, -1), 8),
                    # Rounded corners
                    ("ROUNDEDCORNERS", [4, 4, 4, 4]),
                ]

                # Add subtle row dividers
                for i in range(1, len(attempt_table_data)):
                    table_style.append(("LINEBELOW", (0, i), (-1, i), 0.5, muted_color))

                # Highlight the latest attempt with subtle background
                table_style.append(("BACKGROUND", (0, 1), (-1, 1), muted_color))

                attempt_table.setStyle(TableStyle(table_style))
                story.append(attempt_table)
                story.append(Spacer(1, 16))
        else:
            # Original single attempt per student code - adjusted for portrait
            if student_data:
                # For portrait, show fewer columns to maintain readability
                student_table_data = [["Student Name", "Score", "Status", "Date"]]

                for student in student_data:
                    # Determine status color
                    status_text = (
                        student["status"].value if student["status"] else "N/A"
                    )

                    student_table_data.append(
                        [
                            student["name"],
                            f"{student['score']:.1f}"
                            if student["score"] is not None
                            else "N/A",
                            status_text,
                            student["attempt_date"],
                        ]
                    )

                # Adjusted column widths for portrait orientation
                col_widths = [available_width * w for w in [0.35, 0.15, 0.2, 0.3]]
                student_table = Table(student_table_data, colWidths=col_widths)

                # Modern shadcn-inspired table styling
                table_style = [
                    # Header row
                    ("BACKGROUND", (0, 0), (-1, 0), background_color),
                    ("TEXTCOLOR", (0, 0), (-1, 0), primary_color),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                    ("TOPPADDING", (0, 0), (-1, 0), 10),
                    # Borders
                    ("BOX", (0, 0), (-1, -1), 1, border_color),
                    ("LINEBELOW", (0, 0), (-1, 0), 1, border_color),
                    # Data rows
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
                    ("TOPPADDING", (0, 1), (-1, -1), 8),
                    # Rounded corners
                    ("ROUNDEDCORNERS", [4, 4, 4, 4]),
                ]

                # Add subtle row dividers
                for i in range(1, len(student_table_data) - 1):
                    table_style.append(("LINEBELOW", (0, i), (-1, i), 0.5, muted_color))

                # Apply alternating row background for better readability
                for i in range(1, len(student_table_data)):
                    if i % 2 == 0:
                        table_style.append(("BACKGROUND", (0, i), (-1, i), muted_color))

                student_table.setStyle(TableStyle(table_style))
                story.append(student_table)
            else:
                # Empty state message
                empty_message = Paragraph(
                    "No student data available for the selected filters.",
                    normal_style,
                )
                empty_table = Table([[empty_message]], colWidths=[doc.width])
                empty_table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (0, 0), background_color),
                            ("ALIGN", (0, 0), (0, 0), "CENTER"),
                            ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
                            ("PADDING", (0, 0), (0, 0), 20),
                            ("ROUNDEDCORNERS", [4, 4, 4, 4]),
                            ("BOX", (0, 0), (0, 0), 1, border_color),
                        ]
                    )
                )
                story.append(empty_table)

        from reportlab.pdfgen import canvas as reportlab_canvas

        # Create a numbered canvas for proper page counting
        class NumberedCanvas(reportlab_canvas.Canvas):
            def __init__(self, *args, **kwargs):
                reportlab_canvas.Canvas.__init__(self, *args, **kwargs)
                self._saved_page_states = []

            def showPage(self):
                self._saved_page_states.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                num_pages = len(self._saved_page_states)
                for i, state in enumerate(self._saved_page_states):
                    self.__dict__.update(state)
                    self.draw_page_number(i + 1, num_pages)
                    reportlab_canvas.Canvas.showPage(self)
                reportlab_canvas.Canvas.save(self)

            def draw_page_number(self, page_num, total_pages):
                self.saveState()
                self.setFont("Helvetica", 9)
                self.setFillColor(secondary_color)
                page_text = f"Page {page_num} of {total_pages}"
                self.drawRightString(doc.width + 40, 30, page_text)

                # Add footer line
                self.setStrokeColor(border_color)
                self.line(40, 40, doc.width + 40, 40)

                # Add report ID
                self.setFont("Helvetica", 8)
                self.drawString(40, 30, f"Report ID: {exam_instance_id}")
                self.restoreState()

        # Build the document
        doc.build(story, canvasmaker=NumberedCanvas)

        # Get the PDF content
        pdf_content = buffer.getvalue()
        buffer.close()

        return pdf_content
