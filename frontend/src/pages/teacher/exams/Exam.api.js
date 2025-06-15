import { apiRequest } from "@/lib/utils";

const EXAM_INSTANCES_URL = "/api/v1/exam/teacher/exam-instances";
const REPORT_URL = "/api/v1/exam/teacher/report";

async function fetchExams() {
  try {
    const response = await apiRequest(`${EXAM_INSTANCES_URL}/`);
    return response.data || [];
  } catch (err) {
    console.error("Error fetching exam instances:", err);
    throw err;
  }
}

async function createExam(examData) {
  try {
    return await apiRequest(`${EXAM_INSTANCES_URL}/`, {
      method: 'POST',
      body: JSON.stringify({
        ...examData,
        status: 'draft'
      }),
    });
  } catch (err) {
    console.error("Error creating exam instance:", err);
    throw err;
  }
}

async function getExam(examInstanceId) {
  try {
    return await apiRequest(`${EXAM_INSTANCES_URL}/${examInstanceId}`);
  } catch (err) {
    console.error(`Error fetching exam instance ${examInstanceId}:`, err);
    throw err;
  }
}

async function updateExam(examInstanceId, examData) {
  try {
    return await apiRequest(`${EXAM_INSTANCES_URL}/${examInstanceId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...examData,
        status: 'draft'
      }),
    });
  } catch (err) {
    console.error(`Error updating exam instance ${examInstanceId}:`, err);
    throw err;
  }
}

async function deleteExam(examInstanceId) {
  try {
    return await apiRequest(`${EXAM_INSTANCES_URL}/${examInstanceId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error(`Error deleting exam instance ${examInstanceId}:`, err);
    throw err;
  }
}

async function getExamReport(examInstanceId, params = {}) {
  try {
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString();
    const url = queryString ? `${REPORT_URL}/${examInstanceId}?${queryString}` : `${REPORT_URL}/${examInstanceId}`;
    
    return await apiRequest(url);
  } catch (err) {
    console.error(`Error fetching exam report for ${examInstanceId}:`, err);
    throw err;
  }
}

async function exportExamReportPDF(examInstanceId, params = {}, options = {}) {
  const { headers: customHeaders = {}, signal, ...rest } = options;
  const queryParams = new URLSearchParams(params);
  const queryString = queryParams.toString();
  const url = queryString
    ? `${REPORT_URL}/${examInstanceId}/export-pdf?${queryString}`
    : `${REPORT_URL}/${examInstanceId}/export-pdf`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    signal,
    headers: {
      'Accept': 'application/pdf',
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...customHeaders,
    },
    ...rest,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to export PDF: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `exam-report-${examInstanceId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  return blob;
}


async function fetchStudents() {
  try {
    const response = await apiRequest("/api/v1/users/fetch-students");
    return response.data || [];
  } catch (err) {
    console.error("Error fetching students:", err);
    throw err;
  }
}

export default {
  fetchExams,
  createExam,
  getExam,
  updateExam,
  deleteExam,
  getExamReport,
  exportExamReportPDF,
  fetchStudents,
};