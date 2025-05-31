import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CustomPagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";

import StudentExamsAPI from "./Student.api";

import { ExamsHeader } from "@/components/exams/student/page-header";
import { ExamCard } from "@/components/exams/student/exam-card";
import { ExamFilters } from "@/components/exams/student/filters";
import {
  EmptyExams,
  LoadingExams,
  ErrorExams
} from "@/components/exams/student/handle-exams";

function StudentExams() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [exams, setExams] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("due-date-nearest");
  const [filters, setFilters] = useState({
    dateRange: "all",
    dueDate: "all",
    attempts: "all",
    maxAttempts: [1, 10],
  });
  
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedExams,
    goToPage: handlePageChange
  } = usePagination(exams, 10);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await StudentExamsAPI.fetchStudentExams();
        setAllExams(response);
      } catch (err) {
        const errorMessage = err || "Failed to load exams. Please try again later.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Helper function to determine exam status
  const getExamStatus = useCallback((exam) => {
    const now = new Date();
    const startDate = new Date(exam.exam_instance_id.start_date);
    const endDate = new Date(exam.exam_instance_id.end_date);
    const currentStatus = exam.current_status;
    
    // If current status is submitted
    if (currentStatus === "submitted") {
      // Completed: submitted AND past end date OR max attempts reached
      if (now > endDate || exam.attempts_count >= exam.exam_instance_id.max_attempts) {
        return "completed";
      }
      return "submitted";
    }
    
    // If current status is in_progress
    if (currentStatus === "in_progress") {
      return "in_progress";
    }
    
    // Overdue: past end date AND not submitted
    if (now > endDate && currentStatus !== "submitted") {
      return "overdue";
    }
    
    // Active: within start/end date AND can be started/continued
    if (now >= startDate && now <= endDate) {
      return "active";
    }
    
    // Default to not_started
    return "not_started";
  }, []);

  const sortExams = useCallback((filteredExams) => {
    if (!filteredExams.length) return [];
    
    const sortedExams = [...filteredExams];
    
    switch (sortOption) {
      case "due-date-nearest":
        sortedExams.sort((a, b) => new Date(a.exam_instance_id.end_date) - new Date(b.exam_instance_id.end_date));
        break;
      case "due-date-farthest":
        sortedExams.sort((a, b) => new Date(b.exam_instance_id.end_date) - new Date(a.exam_instance_id.end_date));
        break;
      case "start-date-nearest":
        sortedExams.sort((a, b) => new Date(a.exam_instance_id.start_date) - new Date(b.exam_instance_id.start_date));
        break;
      case "start-date-farthest":
        sortedExams.sort((a, b) => new Date(b.exam_instance_id.start_date) - new Date(a.exam_instance_id.start_date));
        break;
      case "title-az":
        sortedExams.sort((a, b) => a.exam_instance_id.title.localeCompare(b.exam_instance_id.title));
        break;
      case "title-za":
        sortedExams.sort((a, b) => b.exam_instance_id.title.localeCompare(a.exam_instance_id.title));
        break;
      case "max-attempts-high":
        sortedExams.sort((a, b) => b.exam_instance_id.max_attempts - a.exam_instance_id.max_attempts);
        break;
      case "max-attempts-low":
        sortedExams.sort((a, b) => a.exam_instance_id.max_attempts - b.exam_instance_id.max_attempts);
        break;
    }
    
    // Ensure status-based grouping
    return sortedExams.sort((a, b) => {
      const statusPriority = {
        'active': 0,
        'not_started': 1,
        'in_progress': 2,
        'overdue': 3,
        'submitted': 4,
        'completed': 5
      };
      
      const statusA = getExamStatus(a);
      const statusB = getExamStatus(b);
      
      if (activeFilter === "all") {
        return statusPriority[statusA] - statusPriority[statusB];
      }
      return 0;
    });
    
  }, [sortOption, activeFilter, getExamStatus]);

  const applyAllFilters = useCallback(() => {
    if (!allExams.length) return [];
    
    let filteredExams = allExams.filter(exam => {
      const examStatus = getExamStatus(exam);
      
      // Filter by status
      if (activeFilter !== "all" && activeFilter !== examStatus) return false;
      
      // Filter by search query
      if (debouncedSearchQuery &&
          !exam.exam_instance_id.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) &&
          !(exam.exam_instance_id.created_by?.first_name + " " + exam.exam_instance_id.created_by?.last_name)
            .toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return false;
      
      // Filter by start date range
      if (filters.dateRange !== "all") {
        const examStartDate = new Date(exam.exam_instance_id.start_date);
        const now = new Date();
        switch (filters.dateRange) {
          case "today":
            if (examStartDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekFromNow = new Date();
            weekFromNow.setDate(now.getDate() + 7);
            if (examStartDate > weekFromNow) return false;
            break;
          case "month":
            const monthFromNow = new Date();
            monthFromNow.setMonth(now.getMonth() + 1);
            if (examStartDate > monthFromNow) return false;
            break;
        }
      }
      
      // Filter by due date
      if (filters.dueDate !== "all") {
        const examEndDate = new Date(exam.exam_instance_id.end_date);
        const now = new Date();
        switch (filters.dueDate) {
          case "overdue":
            if (examEndDate > now) return false;
            break;
          case "today":
            if (examEndDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekFromNow = new Date();
            weekFromNow.setDate(now.getDate() + 7);
            if (examEndDate > weekFromNow) return false;
            break;
          case "month":
            const monthFromNow = new Date();
            monthFromNow.setDate(now.getDate() + 30);
            if (examEndDate > monthFromNow) return false;
            break;
        }
      }
      
      // Filter by attempts
      if (filters.attempts !== "all") {
        switch (filters.attempts) {
          case "none":
            if (exam.attempts_count !== 0) return false;
            break;
          case "some":
            if (exam.attempts_count === 0 || exam.attempts_count >= exam.exam_instance_id.max_attempts) return false;
            break;
          case "max":
            if (exam.attempts_count < exam.exam_instance_id.max_attempts) return false;
            break;
        }
      }
      
      // Filter by max attempts range
      const maxAttempts = exam.exam_instance_id.max_attempts || 1;
      if (maxAttempts < filters.maxAttempts[0]) return false;
      if (filters.maxAttempts[1] < 10 && maxAttempts > filters.maxAttempts[1]) return false;      
      return true;
    });
    
    return sortExams(filteredExams);
  }, [activeFilter, debouncedSearchQuery, filters, allExams, sortExams, getExamStatus]);

  useEffect(() => {
    const filtered = applyAllFilters();
    setExams(filtered);
  }, [debouncedSearchQuery, activeFilter, sortOption, applyAllFilters]);

  const handleStartExam = async (studentExamId) => {
    try {
      await StudentExamsAPI.startExam(studentExamId);
      toast.success("Exam started successfully");
      navigate(`/exams/${studentExamId}/take`);
    } catch (err) {
      const errorMessage = err || "Failed to start exam. Please try again.";
      setError(errorMessage);
    }
  };

  const handleResumeExam = (studentExamId) => {
    navigate(`/exams/${studentExamId}/take`);
  };

  const handleViewResults = (studentExamId, attemptId) => {
    navigate(`/exams/${studentExamId}/results/${attemptId}`);
  };

  const isExamAvailable = (exam) => {
    const now = new Date();
    const startDate = new Date(exam.exam_instance_id.start_date);
    const endDate = new Date(exam.exam_instance_id.end_date);
    
    return now >= startDate && now <= endDate;
  };

  const canTakeExam = (exam) => {
    return exam.current_status === "not_started" && 
           exam.attempts_count < exam.exam_instance_id.max_attempts &&
           isExamAvailable(exam);
  };

  const canResumeExam = (exam) => {
    return exam.current_status === "in_progress" && isExamAvailable(exam);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster closeButton />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <ExamsHeader exams={allExams}/>
        <div className="max-w-5xl mx-auto flex flex-col space-y-4">
          <ExamFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            filters={filters}
            setFilters={setFilters}
            applyFilters={() => {
              const filtered = applyAllFilters();
              setExams(filtered);
            }}
            sortOption={sortOption}
            setSortOption={setSortOption}
            allExams={allExams}
            getExamStatus={getExamStatus}
          />
          {loading ? (
            <LoadingExams />
          ) : error ? (
            <ErrorExams 
              error={error} 
              retryAction={() => {
                setLoading(true);
                setError(null);
                StudentExamsAPI.fetchStudentExams()
                  .then(data => {
                    setAllExams(data);
                    setLoading(false);
                  })
                  .catch(error => {
                    const errorMessage = error.message || "Failed to load exams. Please try again later.";
                    setError(errorMessage);
                    setLoading(false);
                  });
              }} 
            />
          ) : (
            <div className="space-y-4">
              {exams.length === 0 ? (
                <EmptyExams />
              ) : (
                <>
                  {paginatedExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      onStartExam={handleStartExam}
                      onResumeExam={handleResumeExam}
                      onViewResults={handleViewResults}
                      canTakeExam={canTakeExam(exam)}
                      canResumeExam={canResumeExam(exam)}
                      isExamAvailable={isExamAvailable(exam)}
                    />
                  ))}
                  <CustomPagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default StudentExams;
