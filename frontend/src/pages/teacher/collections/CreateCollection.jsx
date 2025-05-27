import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { QuestionCard } from "@/components/collections/create/question-card";
import { EmptyQuestionsState } from "@/components/collections/create/empty-questions-state";
import { CollectionDetailsForm } from "@/components/collections/create/collection-details-form";
import { PageHeader } from "@/components/collections/create/page-header";
import { QuestionControls } from "@/components/collections/create/question-controls";
import { CustomPagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { DuplicateCollectionModal } from "@/components/collections/confirm-operation-modals";

import CollectionAPI from "./Collections.api";

function CreateCollection() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { collectionId } = useParams();
  const location = useLocation();

  const [isNewCollection, setIsNewCollection] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [collectionData, setCollectionData] = useState({
    title: "",
    description: "",
    status: "draft",
  });
  const [createdBy, setCreatedBy] = useState(null);
  const [canEdit, setCanEdit] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [newQuestions, setNewQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState({ isError: false, message: "" });
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const questionsPerPage = 10;
  const isArchived = collectionData.status === "archived";

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      if (a.position !== undefined) return -1;
      if (b.position !== undefined) return 1;
      return 0;
    });
  }, [questions]);

  const allQuestions = useMemo(
    () => [...newQuestions, ...sortedQuestions],
    [newQuestions, sortedQuestions]
  );
  
  const usedPositions = useMemo(() => {
    return questions
      .filter(q => q.position !== undefined)
      .map(q => q.position);
  }, [questions]);

  const findNextAvailablePosition = () => {
    if (usedPositions.length === 0) return 0;
    
    const sortedPos = [...usedPositions].sort((a, b) => a - b);
    
    for (let i = 0; i < sortedPos.length; i++) {
      if (sortedPos[i] !== i) {
        return i;
      }
    }
    
    return sortedPos.length;
  };

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedQuestions,
    goToPage,
  } = usePagination(allQuestions, questionsPerPage);

  useEffect(() => {
    const isNew = location.pathname.includes("/new") || !collectionId;
    setIsNewCollection(isNew);
    if (!isNew && collectionId) {
      fetchCollectionData(collectionId);
    } else {
      setNewQuestions([]);
      setCanEdit(true);
    }
  }, [collectionId, location.pathname]);

  const fetchCollectionData = async (id) => {
    setIsLoading(true);
    try {
      const res = await CollectionAPI.getCollection(id);
      const data = res.data;
      if (!data) throw new Error();

      setCollectionData({
        title: data.title || "",
        description: data.description || "",
        status: data.status || "draft",
      });

      if (data.created_by) {
        setCreatedBy(data.created_by);
      }

      const canUserEdit = currentUser?.id === data.created_by?.id;
      setCanEdit(canUserEdit);

      if (Array.isArray(data.questions)) {
        setQuestions(
          data.questions.map((q) => ({
            id: q.id,
            type: q.type,
            question_text: q.question_text,
            has_katex: q.has_katex || false,
            weight: q.weight || 1,
            options: q.options || [],
            correct_input_answer: q.correct_input_answer || "",
            position: q.position !== undefined ? q.position : undefined,
            saved: true,
            server_id: q.id,
          }))
        );
      }
    } catch {
      setIsInvalid(true);
      setError({
        isError: true,
        message: "Collection not found. Please check the URL and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 pt-6">
          <p className="text-lg">Loading collection data...</p>
        </main>
        <Footer />
      </div>
    );

  if (isInvalid)
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 p-8 pt-6">
          <div className="max-w-5xl mx-auto">
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
            <div className="flex justify-center mt-8">
              <Button asChild>
                <Link to="/collections">Back to Collections</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );

  const handleInputChange = (e) => {
    setCollectionData({ ...collectionData, [e.target.name]: e.target.value });
  };

  const transitionToToast = {
    "draft:published": () => toast.info("Collection is now public."),
    "published:draft": () => toast.info("Collection is now draft."),
    "archived:draft": () => toast.info("Collection restored to draft status. You can now make changes."),
    "draft:archived": () => toast.info("Collection archived. Restore to draft status to make changes."),
  };
  
  const handleStatusChange = async (value) => {
    const oldStatus = collectionData.status;
    if (isNewCollection) {
      setCollectionData({ ...collectionData, status: value });
      return;
    }  
    try {
      await CollectionAPI.updateCollectionStatus(collectionId, value);
      setCollectionData({ ...collectionData, status: value });
      const key = `${oldStatus}:${value}`;
      const toastFn = transitionToToast[key];
      if (toastFn) toastFn();
  
    } catch (err) {
      setError({
        isError: true,
        message:
          value === "archived"
            ? "Failed to archive collection. Please try again."
            : `Failed to update collection status to ${value}. Please try again.`,
      });
    }
  };
  
  const handleDuplicateClick = () => {
    setIsDuplicateModalOpen(true);
  };
  
  const handleDuplicateConfirm = async (title, description) => {
    try {
      const newCollectionId = await CollectionAPI.duplicateCollection(
        collectionId, 
        title, 
        description
      );
      
      setIsDuplicateModalOpen(false);
      toast.success("Collection duplicated successfully!");
      
      navigate(`/collections/${newCollectionId}`);
    } catch (err) {
      setError({
        isError: true,
        message: "Failed to duplicate collection. Please try again."
      });
      setIsDuplicateModalOpen(false);
    }
  };

  const handleQuestionPositionChange = async (questionId, newPosition) => {
    if (isArchived || !canEdit || isReordering) return;
    
    setIsReordering(true);
    
    try {
      const isNewQuestion = newQuestions.some(q => q.id === questionId);
      const question = isNewQuestion 
        ? newQuestions.find(q => q.id === questionId)
        : questions.find(q => q.id === questionId);
        
      if (!question) return;
      
      const isPositionTaken = [...questions, ...newQuestions].some(q => 
        q.id !== questionId && q.position === newPosition
      );
      
      if (!isPositionTaken) {
        if (isNewQuestion) {
          const updated = { ...question, position: newPosition };
          setNewQuestions(qs => qs.map(q => q.id === questionId ? updated : q));
        } else {
          if (collectionId !== 'new') {
            await CollectionAPI.reorderQuestions(collectionId, { [question.server_id]: newPosition });
          }
          
          setQuestions(qs => 
            qs.map(q => q.id === questionId ? { ...q, position: newPosition } : q)
          );
        }
        
        toast.success("Question position updated");
      } else {
        await handlePositionConflict(questionId, newPosition, isNewQuestion, question);
      }
    } catch (err) {
      console.error("Position update error:", err);
      setError({
        isError: true,
        message: "Failed to update question position. Please try again."
      });
    } finally {
      setIsReordering(false);
    }
  };
  
  const handlePositionConflict = async (questionId, newPosition, isNewQuestion, question) => {
    const updates = {};
    const allQuestionsList = [...questions, ...newQuestions];
    const directConflictPositions = [];

    let currentPosition = newPosition;
    let hasConflictAtPosition = true;
    
    while (hasConflictAtPosition) {
      const conflictsAtPosition = allQuestionsList.filter(q => 
        q.id !== questionId && q.position === currentPosition
      );
      
      if (conflictsAtPosition.length > 0) {
        directConflictPositions.push(currentPosition);
        currentPosition++;
      } else {
        hasConflictAtPosition = false;
      }
    }
    
    // Find questions that need shifting, only those at the direct conflict positions
    const questionsToShift = allQuestionsList.filter(q => 
      q.id !== questionId && 
      directConflictPositions.includes(q.position)
    );
    
    // Sort by position to ensure we shift in proper order (lowest first)
    questionsToShift.sort((a, b) => a.position - b.position);
    
    // Just in case if there are no questions to shift, simply assign the new position
    if (questionsToShift.length === 0) {
      if (isNewQuestion) {
        setNewQuestions(qs => qs.map(q => 
          q.id === questionId ? { ...q, position: newPosition } : q
        ));
      } else {
        if (collectionId !== 'new' && question.server_id) {
          updates[question.server_id] = newPosition;
          await CollectionAPI.reorderQuestions(collectionId, updates);
        }
        
        setQuestions(qs => qs.map(q => 
          q.id === questionId ? { ...q, position: newPosition } : q
        ));
      }
      toast.success("Question position updated");
      return;
    }
    
    if (!isNewQuestion && question.server_id) {
      updates[question.server_id] = newPosition;
    }
    
    // Calculate new positions for shifted questions, maintaining existing gaps
    let nextPosition = newPosition + 1;
    const shiftedMap = new Map();
    
    questionsToShift.forEach(q => {
      shiftedMap.set(q.id, nextPosition);
      
      if (q.server_id) {
        updates[q.server_id] = nextPosition;
      }      
      nextPosition++;
    });
    
    // Send updates to the backend for saved questions
    if (Object.keys(updates).length > 0 && collectionId !== 'new') {
      await CollectionAPI.reorderQuestions(collectionId, updates);
    }
    
    // Update local state for new questions
    if (isNewQuestion) {
      setNewQuestions(qs => qs.map(q => {
        if (q.id === questionId) {
          return { ...q, position: newPosition };
        } else if (shiftedMap.has(q.id)) {
          return { ...q, position: shiftedMap.get(q.id) };
        }
        return q;
      }));
    }
    
    // Update local state for existing questions
    setQuestions(qs => qs.map(q => {
      if (q.id === questionId && !isNewQuestion) {
        return { ...q, position: newPosition };
      } else if (shiftedMap.has(q.id)) {
        return { ...q, position: shiftedMap.get(q.id) };
      }
      return q;
    }));
    
    const shiftedCount = shiftedMap.size;
    toast.success(
      `Position updated. ${shiftedCount} question${
        shiftedCount !== 1 ? 's' : ''
      } shifted.`
    );
  };
  
  const createEmptyQuestion = (type, existingNewPositions = []) => {
    let position = findNextAvailablePosition();
    
    if (existingNewPositions.includes(position)) {
      const allPositions = [...usedPositions, ...existingNewPositions];
      const sortedPos = [...allPositions].sort((a, b) => a - b);
      
      for (let i = 0; i < sortedPos.length; i++) {
        if (sortedPos[i] !== i) {
          position = i;
          break;
        }
      }
      
      if (existingNewPositions.includes(position)) {
        position = sortedPos.length > 0 ? sortedPos[sortedPos.length - 1] + 1 : 0;
      }
    }
    
    return {
      id: `${Date.now()}-${Math.random()}`,
      type,
      question_text: "",
      has_katex: false,
      weight: 1,
      position: position,
      options: ["mcq", "singlechoice"].includes(type)
        ? Array(3).fill({ text: "", is_correct: false })
        : [],
      correct_input_answer: type === "shortanswer" ? "" : "",
      saved: false,
    };
  };

  const addQuestion = (type) => {
    if (isArchived) {
      toast.error("Cannot add questions to an archived collection. Restore to draft first.");
      return;
    }
    if (!canEdit) {
      toast.error("Duplicate collection to make any changes.");
      return;
    }
    
    const newPositions = newQuestions.map(q => q.position).filter(p => p !== undefined);
    
    const newQuestion = createEmptyQuestion(type, newPositions);
    setNewQuestions([newQuestion, ...newQuestions]);
    setActiveTab("questions");
  };

  const removeQuestion = async (id) => {    
    if (newQuestions.some((q) => q.id === id)) {
      setNewQuestions(newQuestions.filter((q) => q.id !== id));
    } else {
      const q = questions.find((q) => q.id === id);
      if (q?.server_id && !isNewCollection) {
        try { 
          await CollectionAPI.deleteQuestion(collectionId, q.server_id);
          toast.success("Question removed successfully.");
        }
        catch {
          setError({
            isError: true,
            message: "Failed to remove question. Please try again."
          });
        }
      }
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const validateQuestion = (q) => {
    if (!q.question_text.trim()) return false;
    if (["mcq", "singlechoice"].includes(q.type)) {
      if (!q.options?.some((o) => o.is_correct)) return false;
      if (q.options.some((o) => !o.text.trim())) return false;
    }
    if (q.type === "shortanswer" && !q.correct_input_answer.trim()) return false;
    return true;
  };

  const handleSaveSingleQuestion = async (questionId, updatedData = null) => {
    setError({ isError: false, message: "" });
    const isNew = newQuestions.some((q) => q.id === questionId);
    let q = isNew
      ? newQuestions.find((q) => q.id === questionId)
      : questions.find((q) => q.id === questionId);
      
    if (updatedData) {
      q = updatedData;
    }
    
    if (!q) return;

    if (!validateQuestion(q)) {
      setError({
        isError: true,
        message: "Question is invalid. Please fix it before saving."
      });
      return;
    }
    
    if (isNew && collectionId === 'new') {
      setError({
        isError: true,
        message: "Save the collection first before adding questions."
      });
      return;
    }

    try {
      let savedId;
      if (q.server_id) {
        await CollectionAPI.updateQuestion(collectionId, q.server_id, q);
        savedId = q.server_id;
      } else {
        const res = await CollectionAPI.addQuestion(collectionId, q);
        savedId = res.data.id;
      }
      const savedQuestion = { ...q, server_id: savedId, saved: true };

      if (isNew) {
        setNewQuestions((prev) => prev.filter((x) => x.id !== questionId));
        setQuestions((prev) => [...prev, savedQuestion]);
      } else {
        setQuestions((prev) =>
          prev.map((x) => (x.id === questionId ? savedQuestion : x))
        );
      }

      toast.success("Question saved successfully.");
    } catch {
      setError({
        isError: true,
        message: "Failed to save question. Please try again."
      });
    }
  };

  const handleSaveCollection = async () => {
    setError({ isError: false, message: "" });
    if (!collectionData.title.trim()) {
      setError({
        isError: true,
        message: "Please provide a title for the collection."
      });
      return;
    }
    setIsSaving(true);
  
    try {
      let collId = collectionId;
      if (isNewCollection) {
        const res = await CollectionAPI.createCollection(collectionData);
        toast.success("Collection created successfully.");
        collId = res.data.collection_id;
        navigate(`/collections/${collId}`, { replace: true });
        setIsNewCollection(false);
      } else {
        await CollectionAPI.updateCollection(collId, collectionData);
        toast.success("Collection updated successfully.");
      }
  
      const unsaved = allQuestions.filter(q => !q.saved);
      const valid = unsaved.filter(validateQuestion);
      const invalid = unsaved.filter(q => !validateQuestion(q));
  
      const questionsToUpdate = valid.filter(q => q.server_id);
      const newQuestionsToAdd = valid.filter(q => !q.server_id);
      
      const updatePromises = questionsToUpdate.map(async q => {
        await CollectionAPI.updateQuestion(collId, q.server_id, q);
        return { ...q, saved: true };
      });
      
      let addedQuestions = [];
      if (newQuestionsToAdd.length > 0) {
        try {
          const bulkResponse = await CollectionAPI.addBulkQuestions(collId, newQuestionsToAdd);
          const questionIds = bulkResponse.data?.question_ids || [];
          
          addedQuestions = newQuestionsToAdd.map((q, index) => {
            const savedId = questionIds[index];
            return savedId ? { ...q, server_id: savedId, saved: true } : q;
          });
        } catch (error) {
          setError({
            isError: true,
            message: error || "Failed to add new questions. Please try again."
          });
        }
      }
      
      const savedQuestions = [...await Promise.all(updatePromises), ...addedQuestions];
  
      setQuestions(prev =>
        prev.map(q => {
          const updated = savedQuestions.find(sq => sq.id === q.id);
          return updated ? { ...q, ...updated } : q;
        })
      );
      
      setQuestions(prev => [
        ...prev,
        ...savedQuestions.filter(sq => 
          sq.server_id && !prev.some(q => q.id === sq.id)
        )
      ]);
      
      setNewQuestions(invalid.filter(q => !q.server_id));
      
      if (invalid.some(q => q.server_id)) {
        setQuestions(prev =>
          prev.map(q => {
            const bad = invalid.find(iq => iq.id === q.id);
            return bad ? { ...q, saved: false } : q;
          })
        );
      }
  
      const updatedCount = questionsToUpdate.length;
      const addedCount = addedQuestions.filter(q => q.server_id).length;
      
      if (updatedCount > 0 || addedCount > 0) {
        let message = "";
        if (updatedCount > 0) {
          message += `Updated ${updatedCount} question${updatedCount > 1 ? "s" : ""}`;
        }
        if (addedCount > 0) {
          message += message ? " and " : "";
          message += `Added ${addedCount} new question${addedCount > 1 ? "s" : ""}`;
        }
        toast.success(message);
      }
      
      if (invalid.length) {
        setError({
          isError: true,
          message: `${invalid.length} question${invalid.length > 1 ? "s" : ""} invalid; please fix them.`
        });
      }
  
    } catch (error) {
      setError({
        isError: true,
        message: "Failed to save collection or questions. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionLocalChange = (questionId, updatedData) => {
    if (newQuestions.some(q => q.id === questionId)) {
      setNewQuestions(qs => qs.map(q => q.id === questionId ? updatedData : q));
    } else {
      setQuestions(qs => qs.map(q => q.id === questionId ? updatedData : q));
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster />
      <main className="flex-1 p-8 pt-6">
        <PageHeader
          title={collectionData.title}
          status={collectionData.status}
          onStatusChange={handleStatusChange}
          onSave={handleSaveCollection}
          onDuplicateClick={handleDuplicateClick}
          error={error.isError}
          errorMessage={error.message}
          canEdit={canEdit || isSaving}
          isNewCollection={isNewCollection}
        />
        <div className="max-w-5xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="details">Collection Details</TabsTrigger>
              <TabsTrigger value="questions">
                Questions ({allQuestions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <CollectionDetailsForm
                collectionData={collectionData}
                collectionId={collectionId}
                onInputChange={handleInputChange}
                onContinue={() => setActiveTab("questions")}
                isArchived={isArchived}
                canEdit={canEdit}
                createdBy={createdBy}
              />
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              <QuestionControls
                onAddQuestion={addQuestion}
                disabled={isArchived || !canEdit}
              />

              {allQuestions.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Showing {paginatedQuestions.length} of {allQuestions.length}{" "}
                    questions (Page {currentPage} of {totalPages})
                  </p>

                  {paginatedQuestions.map((q, i) => {
                    const isNewQ = newQuestions.some((nq) => nq.id === q.id);
                    return (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        index={i + (currentPage - 1) * questionsPerPage}
                        isNew={isNewQ}
                        onSave={handleSaveSingleQuestion}
                        onChange={handleQuestionLocalChange}
                        onRemove={removeQuestion}
                        onPositionChange={handleQuestionPositionChange}
                        usedPositions={usedPositions}
                        canSave={!isNewCollection && canEdit}
                        disabled={isArchived || !canEdit}
                      />
                    );
                  })}

                  {allQuestions.length > questionsPerPage && (
                    <CustomPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                    />
                  )}
                </>
              ) : (
                <EmptyQuestionsState
                  onAddQuestion={addQuestion}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      <DuplicateCollectionModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onConfirm={handleDuplicateConfirm}
        originalTitle={collectionData.title}
        originalDescription={collectionData.description}
      />
    </div>
  );
}

export default CreateCollection;
