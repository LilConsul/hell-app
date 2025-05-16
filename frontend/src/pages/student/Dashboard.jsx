import { useEffect, useState } from "react";
import {
  CalendarIcon,
  Award,
  Clock,
  ArrowRight,
} from "lucide-react";
import { apiRequest } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";


const formatDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end - start;
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  if (durationMinutes >= 1440) {
    const hours = Math.floor(durationMinutes / 60);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
    }
  } else if (durationMinutes > 60) {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  } else {
    return `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`;
  }
};

const fetchStudentData = async () => {
  try {
    const studentExamsData = await apiRequest(
      "/api/v1/exam/student/exams",
      {
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!studentExamsData || typeof studentExamsData !== 'object') {
      throw new Error("API returned invalid data format");
    }

    const studentExams = (studentExamsData?.data || []).map(exam => {
      const examData = exam.exam_instance_id || exam;

      return {
        _id: exam.id || exam._id,
        title: examData.title,
        start_date: examData.start_date,
        end_date: examData.end_date,
        status: examData.status,
        passing_score: examData.passing_score,
        max_attempts: examData.max_attempts,
        score: examData.score,
        passed: examData.passed !== undefined ? examData.passed : null,
        submitted_at: examData.submitted_at
      };
    });

    const completedExams = studentExams.filter(exam =>
      exam.status === "completed" || exam.status === "graded"
    );

    const now = new Date();

    const upcomingExams = studentExams
      .filter(exam => new Date(exam.start_date) > now)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 3);

    const activeExams = studentExams
      .filter(exam =>
        new Date(exam.start_date) <= now &&
        new Date(exam.end_date) >= now
      )
      .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

    const recentResults = completedExams
      .sort((a, b) => new Date(b.submitted_at || b.end_date) - new Date(a.submitted_at || a.end_date))
      .slice(0, 3)
      .map(exam => ({
        _id: exam._id,
        title: exam.title,
        score: exam.score || "N/A",
        passed: exam.passed !== undefined ? exam.passed : null,
        submitted_at: exam.submitted_at || exam.end_date
      }));

    const calendarEvents = studentExams.map(exam => ({
      _id: exam._id,
      title: exam.title,
      start_date: new Date(exam.start_date),
      end_date: new Date(exam.end_date),
      status: exam.status || (
        new Date(exam.start_date) > now ? "upcoming" :
          (new Date(exam.end_date) < now ? "past" : "active")
      )
    }));

    return {
      upcomingExams,
      activeExams,
      recentResults,
      calendarEvents,
      allExams: studentExams
    };
  } catch (error) {
    return {
      upcomingExams: [],
      activeExams: [],
      recentResults: [],
      calendarEvents: [],
      allExams: []
    };
  }
};

const fetchExamDetails = async (examId) => {
  try {
    const response = await apiRequest(
      `/api/v1/exam/student/exams/${examId}`
    );

    if (!response || typeof response !== 'object') {
      throw new Error("Invalid API response");
    }

    const data = response.data;

    return {
      ...data.exam_instance_id,
      _id: examId,
      question_count: data.question_count,
      attempts_allowed: data.attempts_allowed,
      start_date: data.exam_instance_id?.start_date,
      end_date: data.exam_instance_id?.end_date,
      passing_score: data.exam_instance_id?.passing_score,
      title: data.exam_instance_id?.title,
      description: data.exam_instance_id?.description
    };
  } catch (error) {
    return null;
  }
};

const formatDateTimeWithoutSeconds = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatDate = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function StudentDashboard() {
  const [data, setData] = useState({
    upcomingExams: [],
    activeExams: [],
    recentResults: [],
    calendarEvents: [],
    allExams: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [multipleExamDetails, setMultipleExamDetails] = useState([]);
  const [isLoadingMultipleExams, setIsLoadingMultipleExams] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchStudentData()
      .then(data => {
        setData(data);
        setError(null);
      })
      .catch(() => {
        setError("Failed to load your dashboard data. Please try refreshing the page.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      setLoadingDetails(true);
      fetchExamDetails(selectedExamId)
        .then(details => {
          setExamDetails(details);
        })
        .catch(() => {
          setError("Failed to load exam details. Please try again.");
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [selectedExamId]);

  const handleExamSelect = (examId) => {
    setSelectedExamId(examId);
    setMultipleExamDetails([]);
  };

  const handleCloseDetails = () => {
    setSelectedExamId(null);
    setExamDetails(null);
  };

  const handleDayExams = async (exams) => {
    if (exams.length === 1) {
      handleExamSelect(exams[0]._id);
    } else if (exams.length > 1) {
      setIsLoadingMultipleExams(true);
      setMultipleExamDetails([]);
      setSelectedExamId(null);

      try {
        const examDetailsPromises = exams.map(exam => fetchExamDetails(exam._id));
        const allExamDetails = await Promise.all(examDetailsPromises);

        const validExamDetails = allExamDetails.filter(detail => detail !== null);

        setMultipleExamDetails(validExamDetails);
      } catch (error) {
        setError("Failed to load all exam details. Please try again.");
      } finally {
        setIsLoadingMultipleExams(false);
      }
    }
  };

  const handleCloseMultipleExams = () => {
    setMultipleExamDetails([]);
  };

  const handleStartExam = async (examId) => {
    try {
      await apiRequest(
        `/api/v1/exam/student/exam/${examId}/start`,
        {
          method: 'POST'
        }
      );
      window.location.href = `/exam/${examId}`;
    } catch (error) {
      setError("Failed to start the exam. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
        <Card className="bg-muted/10">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-3">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your exam platform. Track your progress and upcoming exams.
            </p>
            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedExamId} onOpenChange={(open) => !open && handleCloseDetails()}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto border-2 border-gray-200 dark:border-neutral-900 rounded-lg bg-white dark:bg-neutral-950">
            <DialogHeader className="border-b border-gray-200 dark:border-neutral-950 pb-4 mb-2">
              <DialogTitle className="text-xl font-bold">Exam Details</DialogTitle>
              <DialogDescription>
                View detailed information about this exam.
              </DialogDescription>
            </DialogHeader>

            {loadingDetails ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
                <Skeleton className="h-4 w-full mt-6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : examDetails ? (
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">{examDetails.title}</h3>
                <p className="text-muted-foreground">{examDetails.description || "No description provided."}</p>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {formatDuration(examDetails.start_date, examDetails.end_date)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="font-medium">{examDetails.question_count || '-'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDateTimeWithoutSeconds(examDetails.start_date)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDateTimeWithoutSeconds(examDetails.end_date)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Passing Score</p>
                    <p className="font-medium">{examDetails.passing_score || '-'}%</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Attempts Allowed</p>
                    <p className="font-medium">{examDetails.attempts_allowed || examDetails.max_attempts || 1}</p>
                  </div>
                </div>


                <DialogFooter className="pt-4 border-t border-gray-200 dark:border-neutral-900 mt-4">
                  {new Date() >= new Date(examDetails.start_date) &&
                    new Date() <= new Date(examDetails.end_date) && (
                      <Button
                        onClick={() => handleStartExam(selectedExamId)}
                        className="inline-flex items-center"
                      >
                        Start Exam <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  {new Date() < new Date(examDetails.start_date) && (
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      This exam is not available to start yet.
                    </span>
                  )}
                  {new Date() > new Date(examDetails.end_date) && (
                    <span className="text-sm text-red-600 dark:text-red-400">
                      This exam is no longer available.
                    </span>
                  )}
                </DialogFooter>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-center text-muted-foreground">
                  Failed to load exam details. Please try again.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={multipleExamDetails.length > 1} onOpenChange={(open) => !open && handleCloseMultipleExams()}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 border-2 border-gray-200 dark:border-neutral-900 rounded-lg bg-white dark:bg-neutral-950">
            <div className="p-6 border-b border-gray-200 dark:border-neutral-900">
              <DialogTitle className="text-xl font-bold">Exams Details</DialogTitle>
              <DialogDescription className="mt-1">
                View detailed information about exams scheduled for this day.
              </DialogDescription>
            </div>

            <ScrollArea className="max-h-[calc(90vh-180px)]">
              <div className="p-6">
                {isLoadingMultipleExams ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={`loading-exam-${i}`} className="animate-pulse p-4">
                        <Skeleton className="h-6 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <Skeleton className="h-8" />
                          <Skeleton className="h-8" />
                          <Skeleton className="h-8" />
                          <Skeleton className="h-8" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {multipleExamDetails.map((examDetail, index) => (
                      <Card key={`exam-detail-${index}`} className="border dark:border-neutral-900 bg-gray-50 dark:bg-neutral-950 shadow-sm">
                        <CardContent className="p-4">
                          <h3 className="text-xl font-semibold mb-2">{examDetail.title}</h3>
                          <p className="text-muted-foreground text-sm mb-4">{examDetail.description || "No description provided."}</p>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="p-2 bg-white dark:bg-neutral-900 rounded shadow-sm">
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-medium">
                                {formatDuration(examDetail.start_date, examDetail.end_date)}
                              </p>
                            </div>

                            <div className="p-2 bg-white dark:bg-neutral-900 rounded shadow-sm">
                              <p className="text-xs text-muted-foreground">Questions</p>
                              <p className="font-medium">{examDetail.question_count || '-'}</p>
                            </div>

                            <div className="p-2 bg-white dark:bg-neutral-900 rounded shadow-sm">
                              <p className="text-xs text-muted-foreground">Passing Score</p>
                              <p className="font-medium">{examDetail.passing_score || '-'}%</p>
                            </div>

                            <div className="p-2 bg-white dark:bg-neutral-900 rounded shadow-sm">
                              <p className="text-xs text-muted-foreground">Start Date</p>
                              <p className="font-medium">{formatDateTimeWithoutSeconds(examDetail.start_date)}</p>
                            </div>

                            <div className="p-2 bg-white dark:bg-neutral-900 rounded shadow-sm">
                              <p className="text-xs text-muted-foreground">End Date</p>
                              <p className="font-medium">{formatDateTimeWithoutSeconds(examDetail.end_date)}</p>
                            </div>

                            <div className="p-2 bg-white dark:bg-neutral-900 rounded shadow-sm">
                              <p className="text-xs text-muted-foreground">Attempts Allowed</p>
                              <p className="font-medium">{examDetail.attempts_allowed || examDetail.max_attempts || 1}</p>
                            </div>
                          </div>


                          <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-neutral-900">
                            {new Date() >= new Date(examDetail.start_date) &&
                              new Date() <= new Date(examDetail.end_date) && (
                                <Button
                                  onClick={() => handleStartExam(examDetail._id)}
                                  size="sm"
                                  className="inline-flex items-center"
                                >
                                  Start Exam <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                              )}
                            {new Date() < new Date(examDetail.start_date) && (
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                This exam is not available to start yet.
                              </span>
                            )}
                            {new Date() > new Date(examDetail.end_date) && (
                              <span className="text-xs text-red-600 dark:text-red-400">
                                This exam is no longer available.
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Card className="shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold dark:text-white"> Exam Calendar</h3>
            </div>

            {loading ? (
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={`skeleton-${i}`} className="h-6 rounded" />
                ))}
              </div>
            ) : (
              <div className="w-full">
                <div className="mb-2">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentDate(date);

                        const dateString = formatDate(date);
                        const examsOnThisDay = data.calendarEvents.filter(event => {
                          const eventStartDate = formatDate(event.start_date);
                          const eventEndDate = formatDate(event.end_date);
                          return dateString >= eventStartDate && dateString <= eventEndDate;
                        });

                        if (examsOnThisDay.length > 0) {
                          handleDayExams(examsOnThisDay);
                        }
                      }
                    }}
                    className="p-0 w-full"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center w-full",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 rounded-md flex items-center justify-center bg-transparent opacity-50",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full",
                      head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative flex-1 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-8 w-full p-0 font-normal",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-gray-200 dark:bg-gray-700 text-accent-foreground font-medium",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                    components={{
                      Day: ({ date, ...props }) => {
                        const dateString = formatDate(date);

                        const examsOnThisDay = data.calendarEvents.filter(event => {
                          const eventStartDate = formatDate(event.start_date);
                          const eventEndDate = formatDate(event.end_date);
                          return dateString >= eventStartDate && dateString <= eventEndDate;
                        });

                        const now = new Date();
                        const isToday = date.getDate() === now.getDate() &&
                          date.getMonth() === now.getMonth() &&
                          date.getFullYear() === now.getFullYear();

                        let hasActiveExam = false;
                        let hasUpcomingExam = false;

                        if (examsOnThisDay.length > 0) {
                          hasActiveExam = examsOnThisDay.some(exam =>
                            new Date(exam.start_date) <= now &&
                            new Date(exam.end_date) >= now
                          );

                          hasUpcomingExam = !hasActiveExam && examsOnThisDay.some(exam =>
                            new Date(exam.start_date) > now
                          );
                        }

                        let dayClasses = "";

                        if (hasActiveExam) {
                          dayClasses += " bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-800/50";
                        } else if (hasUpcomingExam) {
                          dayClasses += " bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 font-medium hover:bg-blue-100 dark:hover:bg-blue-800/50";
                        } else if (isToday) {
                          dayClasses += " bg-accent/20 dark:bg-accent/30 border-2 border-accent dark:border-accent text-accent-foreground font-medium hover:bg-accent/30 dark:hover:bg-accent/40";
                        } else {
                          dayClasses += " hover:bg-accent/10 dark:hover:bg-accent/20 hover:text-accent-foreground";
                        }

                        if (examsOnThisDay.length > 0) {
                          dayClasses += " cursor-pointer";
                        }

                        const className = `h-8 w-full p-0 rounded-md flex items-center justify-center text-xs ${dayClasses}`;

                        return (
                          <div
                            className={className}
                            onClick={examsOnThisDay.length > 0 ? (e) => {
                              e.stopPropagation();
                              handleDayExams(examsOnThisDay);
                            } : undefined}
                            {...(({ displayMonth, ...rest }) => rest)(props)}
                          >
                            {date.getDate()}
                          </div>
                        );
                      }
                    }}
                  />
                </div>

                <div className="flex justify-end mt-2 pt-1 border-t dark:border-muted/20">
                  <div className="flex items-center mr-3">
                    <div className="h-3 w-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800/30 mr-1"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Upcoming</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800/30 mr-1"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Active</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : data.activeExams && data.activeExams.length > 0 ? (
          <Card
            className="shadow-sm hover:bg-muted/20 transition-all duration-200 cursor-pointer"
            onClick={() => handleExamSelect(data.activeExams[0]._id)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-gray-500 dark:text-amber-500" />
                <h3 className="text-base font-medium text-gray-700 dark:text-white">Active Exam</h3>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">{data.activeExams[0].title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Ends: {formatDateTimeWithoutSeconds(data.activeExams[0].end_date)}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300 shadow-sm">
                      In Progress
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-4">
            <h3 className="text-xl font-semibold mb-3">Your Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">

              <div>
                <div className="flex items-center gap-2 mb-5">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <h4 className="font-medium text-lg">Upcoming Exams</h4>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={`loading-upcoming-${i}`} className="bg-muted/5 dark:bg-muted/20 rounded-md p-3">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : data.upcomingExams.length === 0 ? (
                  <p className="text-muted-foreground text-base">No upcoming exams scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {data.upcomingExams.map((exam) => (
                      <div
                        key={`upcoming-${exam._id}`}
                        className="border rounded-md bg-white dark:bg-muted/20 cursor-pointer hover:bg-gray-50 dark:hover:bg-muted/40 hover:shadow-sm transition-shadow p-3"
                        onClick={() => handleExamSelect(exam._id)}
                      >
                        <div className="text-base font-medium truncate">{exam.title}</div>
                        <div className="text-sm text-muted-foreground mt-1.5">
                          Starts: {formatDateTimeWithoutSeconds(exam.start_date)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Award className="h-5 w-5 text-primary" />
                  <h4 className="font-medium text-lg">Recent Results</h4>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={`loading-recent-${i}`} className="bg-muted/5 dark:bg-muted/20 rounded-md p-3">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : data.recentResults.length === 0 ? (
                  <p className="text-muted-foreground text-base">No recent exam results.</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentResults.map((result) => (
                      <div
                        key={`result-${result._id}`}
                        className="border rounded-md bg-white dark:bg-muted/20 cursor-pointer hover:bg-gray-50 dark:hover:bg-muted/40 hover:shadow-sm transition-shadow p-3"
                        onClick={() => handleExamSelect(result._id)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-base font-medium truncate pr-2">{result.title}</span>
                          {result.passed !== null ? (
                            <span className={`text-sm px-2 py-0.5 rounded-sm ${result.passed
                              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                              }`}>
                              {result.passed ? "Passed" : "Failed"}
                            </span>
                          ) : (
                            <span className="text-sm px-2 py-0.5 rounded-sm bg-gray-50 dark:bg-muted/40 text-gray-600 dark:text-gray-400">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1.5">
                          Score: {result.score !== "N/A" ? `${result.score}%` : "Pending"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default StudentDashboard;