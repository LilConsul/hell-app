import { apiRequest } from "@/lib/utils";

export const fetchCollections = async () => {
  try {
    const userCollectionsPromise = apiRequest(
      "/api/v1/exam/teacher/collections/"
    );
    const publicCollectionsPromise = apiRequest(
      "/api/v1/exam/teacher/collections/public"
    );

    const [userData, publicData] = await Promise.all([
      userCollectionsPromise,
      publicCollectionsPromise,
    ]);

    const userCollections = userData.data || [];
    const publicCollections = publicData.data || [];

    const collectionsMap = new Map();

    userCollections.forEach((collection) => {
      collectionsMap.set(collection.id, collection);
    });

    publicCollections.forEach((collection) => {
      if (!collectionsMap.has(collection.id)) {
        collectionsMap.set(collection.id, collection);
      }
    });

    return Array.from(collectionsMap.values());
  } catch (err) {
    console.error("Error fetching collections:", err);
    throw err;
  }
};

export const updateCollectionStatus = async (collectionId, newStatus) => {
  try {
    await apiRequest(
      `/api/v1/exam/teacher/collections/${collectionId}`,
      {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      }
    );

    return { collectionId, newStatus };
  } catch (err) {
    console.error("Error updating collection status:", err);
    throw err;
  }
};

export const deleteCollection = async (collectionId) => {
  try {
    await apiRequest(
      `/api/v1/exam/teacher/collections/${collectionId}`,
      { method: "DELETE" }
    );

    return collectionId;
  } catch (err) {
    console.error("Error deleting collection:", err);
    throw err;
  }
};

export const duplicateCollection = async (
  collectionId,
  title,
  description
) => {
  try {
    // Get original collection
    const detailData = await apiRequest(
      `/api/v1/exam/teacher/collections/${collectionId}`
    );
    const originalCollection = detailData.data;

    // Create new collection
    const newCollectionData = await apiRequest(
      "/api/v1/exam/teacher/collections/",
      {
        method: "POST",
        body: JSON.stringify({ title, description, status: "draft" }),
      }
    );
    const newCollectionId = newCollectionData.data.collection_id;

    // Copy questions
    if (Array.isArray(originalCollection.questions)) {
      for (const question of originalCollection.questions) {
        if (!question) continue;

        const payload = {
          question_text: question.question_text,
          type: question.type,
          weight: question.weight || 1,
          has_katex: question.has_katex || false,
        };

        if (
          question.type === "shortanswer" &&
          question.correct_input_answer
        ) {
          payload.correct_input_answer = question.correct_input_answer;
        }

        if (
          (question.type === "mcq" || question.type === "singlechoice") &&
          question.options
        ) {
          payload.options = question.options.map((opt) => ({
            text: opt.text,
            is_correct: opt.is_correct,
          }));
        }

        await apiRequest(
          `/api/v1/exam/teacher/collections/${newCollectionId}/questions`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }
    }

    return newCollectionId;
  } catch (err) {
    console.error("Error duplicating collection:", err);
    throw err;
  }
};
