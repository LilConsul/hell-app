import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const fetchStudentData = async () => {
  try {
    const studentExamsData = await apiRequest(
      "/api/v1/exam/student/exams",
      { 
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!studentExamsData || typeof studentExamsData !== 'object') {
      throw new Error("API returned invalid data format");
    }
    
    const studentExams = (studentExamsData?.data || []).map(exam => {
      return {
        _id: exam.id || exam._id,  
        title: exam.exam_instance_id?.title || exam.title, 
        start_date: exam.exam_instance_id?.start_date || exam.start_date,
        end_date: exam.exam_instance_id?.end_date || exam.end_date,
        status: exam.exam_instance_id?.status || exam.status,
        passing_score: exam.exam_instance_id?.passing_score || exam.passing_score,
        max_attempts: exam.exam_instance_id?.max_attempts || exam.max_attempts,
        score: exam.exam_instance_id?.score || exam.score,
        passed: exam.exam_instance_id?.passed !== undefined ? exam.exam_instance_id?.passed : exam.passed,
        submitted_at: exam.exam_instance_id?.submitted_at || exam.submitted_at
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
      `/api/v1/exam/student/exams/${examId}`,
      { credentials: 'include' }
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
      description: data.exam_instance_id?.description,
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

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
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
      .catch(err => {
        setError("Failed to load your dashboard data. Please try refreshing the page.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      setLoadingDetails(true);
      fetchExamDetails(selectedExamId, data.allExams)
        .then(details => {
          setExamDetails(details);
        })
        .catch(err => {
          setError("Failed to load exam details. Please try again.");
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [selectedExamId, data.allExams]);

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
          method: 'POST',
          credentials: 'include'
        }
      );
      window.location.href = `/exam/${examId}`;
    } catch (error) {
      setError("Failed to start the exam. Please try again.");
    }
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const today = new Date();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-start-${i}`} className="h-6 p-0.5 text-center bg-gray-50 dark:bg-muted/10 rounded-md opacity-50">
        </div>
      );
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDate(date);
      
      const examsOnThisDay = data.calendarEvents.filter(event => {
        const eventStartDate = formatDate(event.start_date);
        const eventEndDate = formatDate(event.end_date);
        return dateString >= eventStartDate && dateString <= eventEndDate;
      });
      
      const now = new Date();
      
      const isToday = 
        date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear();
      
      let hasActiveExam = false;
      let hasUpcomingExam = false;
      
      if (examsOnThisDay.length > 0) {
        hasActiveExam = examsOnThisDay.some(exam => 
          new Date(exam.start_date) <= now && 
          new Date(exam.end_date) >= now
        );
        
        hasUpcomingExam = examsOnThisDay.some(exam =>
          new Date(exam.start_date) > now
        );
      }
      
      let cellClasses = "h-6 flex flex-col justify-between p-0.5 rounded-md transition-colors relative";
      
      if (hasActiveExam) {
        cellClasses += " bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700";
      } else if (hasUpcomingExam) {
        cellClasses += " bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700";
      } else if (isToday) {
        cellClasses += " bg-white dark:bg-muted/40 shadow-sm ring-1 ring-primary/30 dark:ring-primary/50";
      } else {
        cellClasses += " bg-white dark:bg-muted/20 hover:bg-gray-50 dark:hover:bg-muted/30";
      }
      
      let dayNumberClasses = "text-xs leading-tight";
      
      if (isToday) {
        dayNumberClasses += " font-bold text-primary dark:text-primary-400";
      } else if (hasActiveExam) {
        dayNumberClasses += " font-medium text-amber-800 dark:text-amber-300";
      } else if (hasUpcomingExam) {
        dayNumberClasses += " font-medium text-blue-800 dark:text-blue-300";
      } else {
        dayNumberClasses += " text-gray-700 dark:text-gray-300";
      }
      
      days.push(
        <div 
          key={`day-${month}-${day}-${year}`} 
          className={`${cellClasses} ${examsOnThisDay.length > 0 ? 'cursor-pointer' : ''}`}
          onClick={examsOnThisDay.length > 0 ? () => handleDayExams(examsOnThisDay) : undefined}
        >
          <div className="flex justify-end w-full">
            <span className={dayNumberClasses}>
              {day}
            </span>
          </div>
        </div>
      );
    }
    
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    for (let i = daysInMonth + firstDayOfMonth; i < totalCells; i++) {
      days.push(
        <div key={`empty-end-${i}`} className="h-6 p-0.5 text-center bg-gray-50 dark:bg-muted/10 rounded-md opacity-50">
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
        <Card className="bg-muted/10">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-1">Student Dashboard</h1>
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

        {/* Exam Details Modal */}
        <Dialog open={!!selectedExamId} onOpenChange={(open) => !open && handleCloseDetails()}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto border-2 border-gray-200 dark:border-gray-700 rounded-lg">
            <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-2">
              <DialogTitle className="text-xl font-bold">Exam Details</DialogTitle>
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
                  <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">
                       {(() => {
                        const startDate = new Date(examDetails.start_date);
                        const endDate = new Date(examDetails.end_date);
                        const durationMs = endDate - startDate;
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
                        }  
                        else if (durationMinutes > 60) {
                         const hours = Math.floor(durationMinutes / 60);
                         const minutes = durationMinutes % 60;
                                
                          if (minutes === 0) {
                            return `${hours} hour${hours !== 1 ? 's' : ''}`;
                          } else {
                           return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
                         }
                        } 
                       else {
                         return `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`;
                       }
                      })()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="font-medium">{examDetails.question_count || '-'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Start Date</p>
                   <p className="font-medium">{formatDateTimeWithoutSeconds(examDetails.start_date)}</p>
                 </div>
                 <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDateTimeWithoutSeconds(examDetails.end_date)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Passing Score</p>
                    <p className="font-medium">{examDetails.passing_score || '-'}%</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm">
                  <p className="text-xs text-muted-foreground">Attempts Allowed</p>
                    <p className="font-medium">{examDetails.attempts_allowed || examDetails.max_attempts || 1}</p>
                  </div>
              </div>
        
                {examDetails.instructions && (
                 <div className="mt-4">
                   <h4 className="font-medium mb-2">Instructions</h4>
                   <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm text-sm">
                     {examDetails.instructions}
                    </div>
                  </div>
                )}
        
               <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
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

        {/* Multiple Exams Details Modal */}
        <Dialog open={multipleExamDetails.length > 1} onOpenChange={(open) => !open && handleCloseMultipleExams()}>
  <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
    <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-2 p-6">
      <DialogTitle className="text-xl font-bold">Exams Details</DialogTitle>
    </DialogHeader>
    
    <ScrollArea className="max-h-[calc(90vh-120px)]">
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
              <Card key={`exam-detail-${index}`} className="border dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{examDetail.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{examDetail.description || "No description provided."}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded shadow-sm">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {(() => {
                        const startDate = new Date(examDetail.start_date);
                        const endDate = new Date(examDetail.end_date);
                        const durationMs = endDate - startDate;
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
                      })()}
                    </p>
                  </div>
                  
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded shadow-sm">
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="font-medium">{examDetail.question_count || '-'}</p>
                  </div>
                  
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded shadow-sm">
                    <p className="text-xs text-muted-foreground">Passing Score</p>
                    <p className="font-medium">{examDetail.passing_score || '-'}%</p>
                  </div>
                  
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded shadow-sm">
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDateTimeWithoutSeconds(examDetail.start_date)}</p>
                  </div>
                  
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded shadow-sm">
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDateTimeWithoutSeconds(examDetail.end_date)}</p>
                  </div>
                  
                  <div className="p-2 bg-white dark:bg-neutral-700 rounded shadow-sm">
                    <p className="text-xs text-muted-foreground">Attempts Allowed</p>
                    <p className="font-medium">{examDetail.attempts_allowed || examDetail.max_attempts || 1}</p>
                  </div>
                </div>
                
                {examDetail.instructions && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-1 text-sm">Instructions</h4>
                    <div className="p-3 bg-white dark:bg-neutral-700 rounded shadow-sm text-sm">
                      {examDetail.instructions}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
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
        
        {/* Calendar */}
        <Card className="shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold dark:text-white">Exam Calendar</h3>
              <div className="flex space-x-1 items-center">
                <Button 
                  variant="ghost"
                  size="icon" 
                  className="p-0.5 h-auto w-auto"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs font-medium dark:text-gray-300">
                  {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                </span>
                <Button 
                  variant="ghost"
                  size="icon"
                  className="p-0.5 h-auto w-auto"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={`skeleton-${i}`} className="h-6 rounded" />
                ))}
              </div>
            ) : (
              <>
                {/* Calendar Header - Days of week */}
                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={`weekday-${index}`} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-0.5">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Body */}
                <div className="grid grid-cols-7 gap-0.5">
                  {renderCalendarDays()}
                </div>

                {/* Legend */}
                <div className="flex justify-end mt-2 pt-1 border-t dark:border-muted/20">
                  <div className="flex items-center mr-3">
                    <div className="h-3 w-3 rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 mr-1"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Upcoming</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 mr-1"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Active</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Exam Box */}
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

        {/* Activity and status */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold mb-5">Your Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">

              {/* Upcoming exams */}
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Upcoming Exams</h4>
                </div>
                <div className="flex-1 flex flex-col">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Card key={`loading-upcoming-${i}`} className="p-2 bg-muted/5 dark:bg-muted/20">
                          <CardContent className="p-0">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : data.upcomingExams.length === 0 ? (
                    <p className="text-muted-foreground">No upcoming exams scheduled.</p>
                  ) : (
                    <ul className="space-y-2 flex-1 flex flex-col">
                      {data.upcomingExams.map((exam) => (
                        <Card
                          key={`upcoming-${exam._id}`}
                          className="flex flex-col border dark:border-muted/20 bg-muted/5 dark:bg-muted/20 flex-1 cursor-pointer hover:bg-muted/10 dark:hover:bg-muted/30 hover:shadow-md hover:scale-[1.01] transition-transform"
                          onClick={() => handleExamSelect(exam._id)}
                        >    
                          <CardContent className="p-2">    
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{exam.title}</span>
                            </div>
                            <div className="flex justify-between items-center mt-auto pt-1">
                              <span className="text-xs text-muted-foreground">
                                Starts: {formatDateTimeWithoutSeconds(exam.start_date)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Recent results */}
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Recent Results</h4>
                </div>
                <div className="flex-1 flex flex-col">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Card key={`loading-recent-${i}`} className="p-2 bg-muted/5 dark:bg-muted/20">
                          <CardContent className="p-0">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : data.recentResults.length === 0 ? (
                    <p className="text-muted-foreground">No recent exam results.</p>
                  ) : (
                    <ul className="space-y-2 flex-1 flex flex-col">
                      {data.recentResults.map((result) => (
                        <Card
                          key={`result-${result._id}`}
                          className="flex flex-col border dark:border-muted/20 bg-muted/5 dark:bg-muted/20 flex-1 cursor-pointer hover:bg-muted/10 dark:hover:bg-muted/30 hover:shadow-md hover:scale-[1.01] transition-transform"
                          onClick={() => handleExamSelect(result._id)}
                        >
                          <CardContent className="p-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{result.title}</span>
                            </div>
                            <div className="flex justify-between items-center mt-auto pt-1">
                              <span className="text-xs text-muted-foreground">
                                Score: {result.score !== "N/A" ? `${result.score}%` : "Pending"}
                              </span>
                              {result.passed !== null ? (
                                <Badge className={`w-16 text-center text-[10px] shadow-sm ${
                                  result.passed 
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-50 hover:text-green-700" 
                                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-50 hover:text-red-700"
                                }`}>
                                  {result.passed ? "Passed" : "Failed"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="w-16 text-center text-[10px] bg-gray-50 dark:bg-muted/40 text-gray-600 dark:text-gray-400 shadow-sm">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </ul>
                  )}
                </div>
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