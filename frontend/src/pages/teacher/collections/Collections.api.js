export const fetchCollections = async () => {
    try {
      const userCollectionsPromise = fetch("/api/v1/exam/teacher/collections/", {
        credentials: "include",
      });
      const publicCollectionsPromise = fetch("/api/v1/exam/teacher/collections/public", {
        credentials: "include",
      });
  
      const [userResponse, publicResponse] = await Promise.all([
        userCollectionsPromise,
        publicCollectionsPromise
      ]);
  
      if (!userResponse.ok || !publicResponse.ok) {
        throw new Error("Failed to fetch collections");
      }
  
      const userData = await userResponse.json();
      const publicData = await publicResponse.json();
  
      return [...(userData.data || []), ...(publicData.data || [])];
    } catch (err) {
      console.error("Error fetching collections:", err);
      throw err;
    }
  };
  
  export const updateCollectionStatus = async (collectionId, newStatus) => {
    try {
      const response = await fetch(`/api/v1/exam/teacher/collections/${collectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include"
      });
  
      if (!response.ok) throw new Error("Failed to update status");
  
      return { collectionId, newStatus };
    } catch (err) {
      console.error("Error updating collection status:", err);
      throw err;
    }
  };
  
  export const deleteCollection = async (collectionId) => {
    try {
      const response = await fetch(`/api/v1/exam/teacher/collections/${collectionId}`, {
        method: "DELETE",
        credentials: "include"
      });
  
      if (!response.ok) throw new Error("Failed to delete collection");
  
      return collectionId;
    } catch (err) {
      console.error("Error deleting collection:", err);
      throw err;
    }
  };
  
  export const duplicateCollection = async (collectionId, title, description) => {
    try {
      // Get collection details
      const detailResponse = await fetch(`/api/v1/exam/teacher/collections/${collectionId}`, {
        credentials: "include",
      });
  
      if (!detailResponse.ok) throw new Error("Failed to fetch collection details");
  
      const detailData = await detailResponse.json();
      const originalCollection = detailData.data;
  
      // Create new collection
      const createResponse = await fetch("/api/v1/exam/teacher/collections/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status: "draft" }),
        credentials: "include"
      });
  
      if (!createResponse.ok) throw new Error("Failed to create new collection");
  
      const newCollectionData = await createResponse.json();
      const newCollectionId = newCollectionData.data.collection_id;
  
      // Copy questions
      if (originalCollection.questions?.length > 0) {
        for (const question of originalCollection.questions) {
          if (question) {
            const questionPayload = {
              question_text: question.question_text,
              type: question.type,
              weight: question.weight || 1,
              has_katex: question.has_katex || false
            };
  
            if (question.type === "shortanswer" && question.correct_input_answer) {
              questionPayload.correct_input_answer = question.correct_input_answer;
            }
  
            if ((question.type === "mcq" || question.type === "singlechoice") && question.options) {
              questionPayload.options = question.options.map(option => ({
                text: option.text,
                is_correct: option.is_correct
              }));
            }
  
            await fetch(`/api/v1/exam/teacher/collections/${newCollectionId}/questions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(questionPayload),
              credentials: "include"
            });
          }
        }
      }
  
      return newCollectionId;
    } catch (err) {
      console.error("Error duplicating collection:", err);
      throw err;
    }
  };