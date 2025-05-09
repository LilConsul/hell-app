import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
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

import CollectionAPI from "./Collections.api";

function CreateCollection() {
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
  const [questions, setQuestions] = useState([]);
  const [newQuestions, setNewQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState({
    isError: false,
    message: ""
  });

  const questionsPerPage = 10;
  const isArchived = collectionData.status === "archived";

  const allQuestions = useMemo(() => [...newQuestions, ...questions], [newQuestions, questions]);
  
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedQuestions,
    goToPage
  } = usePagination(allQuestions, questionsPerPage);

  const statusDisplayMap = { 
    draft: "Draft", 
    published: "Public",
    archived: "Archived"
  };

  useEffect(() => {
    const isNew = location.pathname.includes("/new") || !collectionId;
    setIsNewCollection(isNew);
    if (!isNew && collectionId) {
      fetchCollectionData(collectionId);
    } else {
      setNewQuestions([]);
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
            saved: true,
            server_id: q.id,
          }))
        );
      }
    } catch {
      setIsInvalid(true);
      setError({
        isError: true,
        message: "Collection not found. Please check the URL and try again."
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
      </div>
    );

  if (isInvalid)
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 p-8 pt-6">
          <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-8">
            <Button asChild>
              <Link to="/collections">Back to Collections</Link>
            </Button>
          </div>
        </main>
      </div>
    );

  const handleInputChange = (e) => {
    // Prevent changes if collection is archived
    if (isArchived) {
      toast.error("Cannot modify an archived collection. Restore to draft first.");
      return;
    }
    setCollectionData({ ...collectionData, [e.target.name]: e.target.value });
  };

  const transitionToToast = {
    "draft:published": () => toast.success("Collection is now public."),
    "published:draft": () => toast.info("Collection is now draft."),
    "archived:draft": () => toast.success("Collection restored to draft status. You can now make changes."),
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
  

  const createEmptyQuestion = (type) => ({
    id: `${Date.now()}-${Math.random()}`,
    type,
    question_text: "",
    has_katex: false,
    weight: 1,
    options: ["mcq", "singlechoice"].includes(type)
      ? Array(3).fill({ text: "", is_correct: false })
      : [],
    correct_input_answer: type === "shortanswer" ? "" : "",
    saved: false,
  });

  const addQuestion = (type) => {
    if (isArchived) {
      toast.error("Cannot add questions to an archived collection. Restore to draft first.");
      return;
    }
    setNewQuestions([createEmptyQuestion(type), ...newQuestions]);
    setActiveTab("questions");
  };

  const removeQuestion = async (id) => {
    if (isArchived) {
      toast.error("Cannot remove questions from an archived collection. Restore to draft first.");
      return;
    }
    
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

  const updateList = (list, setList, id, updater) => {
    // Prevent updates if collection is archived
    if (isArchived) return;
    
    const idx = list.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const updated = [...list];
    updated[idx] = { ...updater(updated[idx]), saved: false };
    setList(updated);
  };

  const updateQuestionText = (id, text) => {
    if (isArchived) {
      toast.error("Cannot modify questions in an archived collection. Restore to draft first.");
      return;
    }
    
    updateList(newQuestions, setNewQuestions, id, (q) => ({
      ...q,
      question_text: text,
    }));
    updateList(questions, setQuestions, id, (q) => ({
      ...q,
      question_text: text,
    }));
  };

  const updateOptionText = (id, idx, text) => {
    if (isArchived) return;
    
    updateList(newQuestions, setNewQuestions, id, (q) => {
      if (!q.options) return q;
      const opts = [...q.options];
      opts[idx] = { ...opts[idx], text };
      return { ...q, options: opts };
    });
    updateList(questions, setQuestions, id, (q) => {
      if (!q.options) return q;
      const opts = [...q.options];
      opts[idx] = { ...opts[idx], text };
      return { ...q, options: opts };
    });
  };

  const toggleCorrectOption = (id, idx) => {
    if (isArchived) return;
    
    const toggle = (q) => {
      if (!q.options) return q;
      const opts =
        q.type === "singlechoice"
          ? q.options.map((o, i) => ({ ...o, is_correct: i === idx }))
          : q.options.map((o, i) =>
              i === idx ? { ...o, is_correct: !o.is_correct } : o
            );
      return { ...q, options: opts };
    };
    updateList(newQuestions, setNewQuestions, id, toggle);
    updateList(questions, setQuestions, id, toggle);
  };

  const updateShortAnswer = (id, ans) => {
    if (isArchived) return;
    
    updateList(newQuestions, setNewQuestions, id, (q) => ({
      ...q,
      correct_input_answer: ans,
    }));
    updateList(questions, setQuestions, id, (q) => ({
      ...q,
      correct_input_answer: ans,
    }));
  };

  const updateWeight = (id, weight) => {
    if (isArchived) return;
    
    const w = parseInt(weight, 10);
    updateList(newQuestions, setNewQuestions, id, (q) => ({ ...q, weight: w }));
    updateList(questions, setQuestions, id, (q) => ({ ...q, weight: w }));
  };

  const addOption = (id) => {
    if (isArchived) return;
    
    updateList(newQuestions, setNewQuestions, id, (q) => ({
      ...q,
      options: [...(q.options || []), { text: "", is_correct: false }],
    }));
    updateList(questions, setQuestions, id, (q) => ({
      ...q,
      options: [...(q.options || []), { text: "", is_correct: false }],
    }));
  };

  const removeOption = (id, idx) => {
    if (isArchived) return;
    
    updateList(newQuestions, setNewQuestions, id, (q) => ({
      ...q,
      options: (q.options || []).filter((_, i) => i !== idx),
    }));
    updateList(questions, setQuestions, id, (q) => ({
      ...q,
      options: (q.options || []).filter((_, i) => i !== idx),
    }));
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

  const handleSaveSingleQuestion = async (questionId) => {
    if (isArchived) {
      toast.error("Cannot save questions in an archived collection. Restore to draft first.");
      return;
    }
    
    setError({ isError: false, message: "" });
    const isNew = newQuestions.some((q) => q.id === questionId);
    const q = isNew
      ? newQuestions.find((q) => q.id === questionId)
      : questions.find((q) => q.id === questionId);
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
    if (isArchived) {
      toast.error("Cannot save changes to an archived collection. Restore to draft first.");
      return;
    }
    
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
      } else {
        await CollectionAPI.updateCollection(collectionId, collectionData);
      }

      const valid = newQuestions.filter(validateQuestion);
      const invalid = newQuestions.filter((q) => !validateQuestion(q));

      const ids = await Promise.all(
        valid.map((q) =>
          CollectionAPI.addQuestion(collId, q).then((r) => r.data.id)
        )
      );

      setQuestions((prev) => [
        ...prev,
        ...valid.map((q, i) => ({ ...q, server_id: ids[i], saved: true })),
      ]);
      setNewQuestions(invalid);

      if (valid.length)
        toast.success(`Saved ${valid.length} question${valid.length > 1 ? "s" : ""}`);
      if (invalid.length) {
        setError({
          isError: true,
          message: `${invalid.length} question${invalid.length > 1 ? "s" : ""} invalid; please fix.`
        });
      } else {
        toast.success("Collection saved successfully.");
        if (isNewCollection && collId) {
          navigate(`/collections/${collId}`, { replace: true });
          setIsNewCollection(false);
        }
      }
    } catch {
      setError({
        isError: true,
        message: "Failed to save collection. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => collectionData.title.trim() !== "";

  // Determine subtitle based on collection status
  const getSubtitle = () => {
    if (isNewCollection) return "Create a new collection of test questions";
    if (isArchived) return "This collection is archived and cannot be edited";
    return "Edit collection details and questions";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster />
      <main className="flex-1 p-8 pt-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title={isNewCollection ? "Create Test Collection" : `Edit ${collectionData.title}`}
            subtitle={getSubtitle()}
            status={collectionData.status}
            onStatusChange={handleStatusChange}
            onSave={handleSaveCollection}
            isSaveDisabled={!isFormValid() || isSaving || isArchived}
            error={error.isError}
            errorMessage={error.message}
          />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Collection Details</TabsTrigger>
              <TabsTrigger value="questions">
                Questions ({questions.length + newQuestions.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
              <CollectionDetailsForm
                collectionData={collectionData}
                onInputChange={handleInputChange}
                statusDisplayMap={statusDisplayMap}
                onContinue={() => setActiveTab("questions")}
                isArchived={isArchived}
              />
            </TabsContent>
            <TabsContent value="questions" className="space-y-4">
              <QuestionControls onAddQuestion={addQuestion} disabled={isArchived} />
              <div className="space-y-4">
                {allQuestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      Showing {paginatedQuestions.length} of {allQuestions.length} questions 
                      (Page {currentPage} of {totalPages})
                    </p>
                  </div>
                )}
                
                {paginatedQuestions.map((q, i) => {
                  const isNewQ = newQuestions.some(nq => nq.id === q.id);
                  return (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={i + (currentPage - 1) * questionsPerPage}
                      isNew={isNewQ}
                      onSave={handleSaveSingleQuestion}
                      onRemove={removeQuestion}
                      onUpdateText={updateQuestionText}
                      onUpdateOption={updateOptionText}
                      onUpdateCorrectOption={toggleCorrectOption}
                      onAddOption={addOption}
                      onRemoveOption={removeOption}
                      onUpdateWeight={updateWeight}
                      onUpdateShortAnswer={updateShortAnswer}
                      canSave={!isNewCollection || !!collectionId}
                      disabled={isArchived}
                    />
                  );
                })}
                
                {!allQuestions.length && (
                  <EmptyQuestionsState onAddQuestion={addQuestion} disabled={isArchived} />
                )}
                
                {allQuestions.length > questionsPerPage && (
                  <CustomPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default CreateCollection;