import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CustomPagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useExamStatus } from "@/hooks/use-student-exam-status";

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
  const statusHook = useExamStatus();
  const { getExamStatus } = statusHook;
  
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

  // Memoize exams with derived status
  const enrichedAllExams = useMemo(() => {
    return allExams.map(exam => ({
      ...exam,
      derivedStatus: getExamStatus(exam)
    }));
  }, [allExams, getExamStatus]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load on mount
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

  // Memoized sorting function
  const sortExams = useCallback((filteredExams) => {
    if (!filteredExams.length) return [];
    
    const sortedExams = [...filteredExams];
    
    // Apply selected sort
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
    
    // Apply status priority sorting when showing all exams
    if (activeFilter === "all") {
      const statusPriority = {
        'active': 0,
        'not_started': 1,
        'in_progress': 2,
        'overdue': 3,
        'submitted': 4,
        'completed': 5
      };
      
      return sortedExams.sort((a, b) => {
        const primarySort = statusPriority[a.derivedStatus] - statusPriority[b.derivedStatus];
        return primarySort !== 0 ? primarySort : 0; // Keep existing sort if same priority
      });
    }
    
    return sortedExams;
  }, [sortOption, activeFilter]);

  // Memoized filtering and sorting
  const applyAllFilters = useCallback(() => {
    if (!enrichedAllExams.length) return [];
    
    let filteredExams = enrichedAllExams.filter(exam => {
      // Status filter
      if (activeFilter !== "all" && activeFilter !== exam.derivedStatus) return false;
      
      // Search filter
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const titleMatch = exam.exam_instance_id.title.toLowerCase().includes(searchLower);
        const instructorMatch = (exam.exam_instance_id.created_by?.first_name + " " + exam.exam_instance_id.created_by?.last_name)
          .toLowerCase().includes(searchLower);
        
        if (!titleMatch && !instructorMatch) return false;
      }
      
      return true;
    });
    
    return sortExams(filteredExams);
  }, [activeFilter, debouncedSearchQuery, enrichedAllExams, sortExams]);

  // Apply filters when dependencies change
  useEffect(() => {
    const filtered = applyAllFilters();
    setExams(filtered);
  }, [applyAllFilters]);

  // Event handlers
  const handleStartExam = async (studentExamId) => {
    navigate(`/exams/${studentExamId}/take`);

  };

  const handleResumeExam = (studentExamId) => {
    navigate(`/exams/${studentExamId}/take`);
  };

  const handleRetry = useCallback(() => {
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
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster closeButton />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <ExamsHeader exams={enrichedAllExams} getExamStatus={getExamStatus} />
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
            allExams={enrichedAllExams}
            getExamStatus={getExamStatus}
          />
          {loading ? (
            <LoadingExams />
          ) : error ? (
            <ErrorExams 
              error={error} 
              retryAction={handleRetry}
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