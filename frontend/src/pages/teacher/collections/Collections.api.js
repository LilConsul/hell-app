import { apiRequest } from "@/lib/utils";

const COLLECTIONS_URL = "/api/v1/exam/teacher/collections";


async function fetchCollections() {
  try {
    const [userRes, publicRes] = await Promise.all([
      apiRequest(`${COLLECTIONS_URL}/`),
      apiRequest(`${COLLECTIONS_URL}/public`),
    ]);

    const userCollections = userRes.data || [];
    const publicCollections = publicRes.data || [];
    const map = new Map();

    userCollections.forEach(col => map.set(col.id, col));
    publicCollections.forEach(col => {
      if (!map.has(col.id)) map.set(col.id, col);
    });

    return Array.from(map.values());
  } catch (err) {
    console.error("Error fetching collections:", err);
    throw err;
  }
}

async function createCollection(collectionData) {
  try {
    return apiRequest(`${COLLECTIONS_URL}/`, {
      method: 'POST',
      body: JSON.stringify(collectionData),
    });
  } catch (err) {
    console.error("Error creating collection:", err);
    throw err;
  }
}

async function getCollection(collectionId) {
  try {
    return await apiRequest(`${COLLECTIONS_URL}/${collectionId}`);
  } catch (err) {
    console.error(`Error fetching collection ${collectionId}:`, err);
    throw err;
  }
}

async function updateCollection(collectionId, collectionData) {
  try {
    return await apiRequest(`${COLLECTIONS_URL}/${collectionId}`, {
      method: 'PUT',
      body: JSON.stringify(collectionData),
    });
  } catch (err) {
    console.error(`Error updating collection ${collectionId}:`, err);
    throw err;
  }
}

async function updateCollectionStatus(collectionId, newStatus) {
  try {
    return await apiRequest(`${COLLECTIONS_URL}/${collectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (err) {
    console.error(`Error updating status for collection ${collectionId}:`, err);
    throw err;
  }
}

async function deleteCollection(collectionId) {
  try {
    return await apiRequest(`${COLLECTIONS_URL}/${collectionId}`, { method: 'DELETE' });
  } catch (err) {
    console.error(`Error deleting collection ${collectionId}:`, err);
    throw err;
  }
}

async function duplicateCollection(collectionId, title, description) {
  try {
    const detailRes = await apiRequest(`${COLLECTIONS_URL}/${collectionId}`);
    const original = detailRes.data;

    const newRes = await apiRequest(`${COLLECTIONS_URL}/`, {
      method: 'POST',
      body: JSON.stringify({ title, description, status: 'draft' }),
    });
    const newId = newRes.data.collection_id;

    // Copy each question
    if (Array.isArray(original.questions)) {
      for (const q of original.questions) {
        if (!q) continue;
        const payload = {
          question_text: q.question_text,
          type: q.type,
          weight: q.weight || 1,
          has_katex: q.has_katex || false,
        };
        if (q.type === 'shortanswer' && q.correct_input_answer) {
          payload.correct_input_answer = q.correct_input_answer;
        }
        if ((q.type === 'mcq' || q.type === 'singlechoice') && q.options) {
          payload.options = q.options.map(opt => ({
            text: opt.text,
            is_correct: opt.is_correct,
          }));
        }
        await apiRequest(`${COLLECTIONS_URL}/${newId}/questions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    }

    return newId;
  } catch (err) {
    console.error(`Error duplicating collection ${collectionId}:`, err);
    throw err;
  }
}

async function addQuestion(collectionId, questionData) {
  try {
    return await apiRequest(`${COLLECTIONS_URL}/${collectionId}/questions`, {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  } catch (err) {
    console.error(`Error adding question to collection ${collectionId}:`, err);
    throw err;
  }
}

async function addBulkQuestions(collectionId, questions) {
  try {
    return await apiRequest(`${COLLECTIONS_URL}/${collectionId}/questions/bulk`, {
      method: 'POST',
      body: JSON.stringify(questions),
    });
  } catch (err) {
    console.error(`Error adding bulk questions to collection ${collectionId}:`, err);
    throw err;
  }
}

async function updateQuestion(collectionId, questionId, questionData) {
  try {
    return await apiRequest(`${COLLECTIONS_URL}/${collectionId}/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(questionData),
    });
  } catch (err) {
    console.error(`Error updating question ${questionId} in collection ${collectionId}:`, err);
    throw err;
  }
}

async function deleteQuestion(collectionId, questionId) {
  try {
    return await apiRequest(`${COLLECTIONS_URL}/${collectionId}/questions/${questionId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error(`Error deleting question ${questionId} from collection ${collectionId}:`, err);
    throw err;
  }
}

export default {
  fetchCollections,
  createCollection,
  getCollection,
  updateCollection,
  updateCollectionStatus,
  deleteCollection,
  duplicateCollection,
  addQuestion,
  addBulkQuestions,
  updateQuestion,
  deleteQuestion,
};
