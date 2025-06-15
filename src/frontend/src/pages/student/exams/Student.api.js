import { apiRequest } from "@/lib/utils";

const STUDENT_EXAMS_URL = "/api/v1/exam/student";

async function fetchStudentExams() {
  try {
    const response = await apiRequest(`${STUDENT_EXAMS_URL}/exams`);
    return response.data || [];
  } catch (err) {
    console.error("Error fetching student exams:", err);
    throw err;
  }
}

async function getStudentExam(studentExamId) {
  try {
    return await apiRequest(`${STUDENT_EXAMS_URL}/exams/${studentExamId}`);
  } catch (err) {
    console.error(`Error fetching student exam ${studentExamId}:`, err);
    throw err;
  }
}

async function getExamAttempt(attemptId) {
  try {
    return await apiRequest(`${STUDENT_EXAMS_URL}/exam/${attemptId}`);
  } catch (err) {
    console.error(`Error fetching exam attempt ${attemptId}:`, err);
    throw err;
  }
}

async function startExam(studentExamId) {
  try {
    return await apiRequest(`${STUDENT_EXAMS_URL}/exam/${studentExamId}/start`, {
      method: 'POST',
    });
  } catch (err) {
    console.error(`Error starting exam ${studentExamId}:`, err);
    throw err;
  }
}

async function saveAnswer(studentExamId, answerData) {
  try {
    return await apiRequest(`${STUDENT_EXAMS_URL}/exam/${studentExamId}/save_answer`, {
      method: 'PUT',
      body: JSON.stringify(answerData),
    });
  } catch (err) {
    console.error(`Error saving answer for exam ${studentExamId}:`, err);
    throw err;
  }
}

async function toggleFlagQuestion(studentExamId, questionId) {
  try {
    return await apiRequest(`${STUDENT_EXAMS_URL}/exam/${studentExamId}/toggle_flag_question`, {
      method: 'PUT',
      body: JSON.stringify({ question_id: questionId }),
    });
  } catch (err) {
    console.error(`Error toggling flag for question ${questionId} in exam ${studentExamId}:`, err);
    throw err;
  }
}

async function reloadExam(studentExamId) {
  try {
    return await apiRequest(`${STUDENT_EXAMS_URL}/exam/${studentExamId}/reload`);
  } catch (err) {
    console.error(`Error reloading exam ${studentExamId}:`, err);
    throw err;
  }
}

async function submitExam(studentExamId) {
  try {
    return await apiRequest(`${STUDENT_EXAMS_URL}/exam/${studentExamId}/submit`, {
      method: 'POST',
    });
  } catch (err) {
    console.error(`Error submitting exam ${studentExamId}:`, err);
    throw err;
  }
}

export default {
  fetchStudentExams,
  getStudentExam,
  getExamAttempt,
  startExam,
  saveAnswer,
  toggleFlagQuestion,
  reloadExam,
  submitExam,
};
