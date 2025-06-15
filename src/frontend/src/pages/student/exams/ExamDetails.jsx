import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import StudentExamsAPI from "./Student.api";
import { ExamDetailsHeader } from "@/components/exams/student/exam-details/page-header";
import { ExamDetailsInfo } from "@/components/exams/student/exam-details/info";
import { ExamDetailsActions } from "@/components/exams/student/exam-details/actions";
import { ExamDetailsAttempts } from "@/components/exams/student/exam-details/attempts";
import { LoadingExamDetails, ErrorExamDetails } from "@/components/exams/student/handle-exams";

function StudentExamDetails() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (examId) {
      loadExam();
    }
  }, [examId]);

  if (loading) {
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

  if (error) {
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Exam not found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              The exam you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster closeButton />
      <main className="flex-1 space-y-6 p-8 pt-6">
      <ExamDetailsHeader exam={exam} />
        <div className="max-w-5xl mx-auto space-y-6">
          <ExamDetailsInfo exam={exam} />
          <ExamDetailsActions exam={exam} />
          <ExamDetailsAttempts exam={exam} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default StudentExamDetails;