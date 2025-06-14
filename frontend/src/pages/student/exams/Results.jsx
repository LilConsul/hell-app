import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import StudentExamsAPI from "./Student.api";

import { LoadingExamDetails, ErrorExamDetails } from "@/components/exams/student/handle-exams";
import { ResultsHeader } from "@/components/exams/student/results/results-header";
import { ResultsContent } from "@/components/exams/student/results/results-content";
import { AttemptSelectorForExplorerUsers } from "@/components/exams/student/results/attempt-selector-for-explorer-users";

function StudentExamResults() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [exam, setExam] = useState(null);
  const [attemptData, setAttemptData] = useState(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState(searchParams.get('attemptId'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const roundScore = (score) => {
    if (score === null || score === undefined) return null;
    return Math.round(score * 100) / 100;
  };

  // Load exam data
  const loadExam = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await StudentExamsAPI.getStudentExam(examId);
      setExam(response.data);
    } catch (err) {
      const errorMessage = err?.message || err || "Failed to load exam details. Please try again later.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load specific attempt data
  const loadAttemptData = async (attemptId) => {
    if (!attemptId) {
      setAttemptData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await StudentExamsAPI.getExamAttempt(attemptId);
      
      // Apply score rounding to the attempt data
      const processedData = {
        ...response.data,
        grade: roundScore(response.data.grade)
      };
      
      setAttemptData(processedData);
    } catch (err) {
      const errorMessage = err?.message || err || "Failed to load attempt details. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExam();
    }
  }, [examId]);

  useEffect(() => {
    if (selectedAttemptId) {
      loadAttemptData(selectedAttemptId);
      setSearchParams({ attemptId: selectedAttemptId });
    } else {
      setAttemptData(null);
      setSearchParams({});
    }
  }, [selectedAttemptId, setSearchParams]);

  const handleAttemptChange = (attemptId) => {
    setSelectedAttemptId(attemptId);
  };

  const handleSelectAttempt = (attemptId) => {
    setSelectedAttemptId(attemptId);
  };

  const handleBackToExamDetails = () => {
    navigate(`/exams/${examId}`);
  };

  if (loading && !exam) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <LoadingExamDetails />
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <Toaster closeButton />
        <main className="flex-1">
          <ErrorExamDetails error={error} retryAction={loadExam} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Exam not found</h2>
            <p className="text-muted-foreground mt-2">
              The exam you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasAttempts = exam.attempts && exam.attempts.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster closeButton />
      <main className="flex-1 space-y-6 p-8 pt-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {!hasAttempts ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No Attempts Found</h3>
              <p className="text-muted-foreground">
                You haven't submitted any attempts for this exam yet.
              </p>
            </div>
          ) : !selectedAttemptId ? (
            <AttemptSelectorForExplorerUsers
              exam={exam}
              onSelectAttempt={handleSelectAttempt}
              onBackToExamDetails={handleBackToExamDetails}
            />
          ) : (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading attempt results...</p>
                  </div>
                </div>
              ) : attemptData ? (
                <>
                  <ResultsHeader 
                    attemptData={attemptData}
                    examTitle={exam.exam_instance_id.title}
                    passingScore={exam.exam_instance_id.passing_score}
                    allAttempts={exam.attempts}
                    onAttemptChange={handleAttemptChange}
                    examId={examId}
                  />
                  <ResultsContent 
                    attemptData={attemptData}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Failed to load attempt data.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default StudentExamResults;