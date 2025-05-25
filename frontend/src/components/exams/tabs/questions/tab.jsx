import React, { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Weight, CheckCircle2, CircleDot, FileText, Filter, FileQuestion } from "lucide-react";

import { QuestionCard } from "@/components/collections/create/question-card";
import { QuestionsStateHandler } from "./state-handler";
import { usePagination } from "@/hooks/use-pagination";
import { CustomPagination } from "@/components/pagination";

import collectionAPI from "@/pages/teacher/collections/Collections.api";

// Memoized QuestionCard to prevent unnecessary re-renders
const MemoQuestionCard = memo(QuestionCard);

//Renders the list of questions, including empty and filtered states.
function QuestionsContent({
  filteredQuestions,
  activeFilter,
  statistics,
  paginatedQuestions,
  currentPage,
  totalPages,
  goToPage,
}) {
  if (filteredQuestions.length === 0 && activeFilter !== "all") {
    const filterLabels = {
      mcq: "Multiple Choice",
      singlechoice: "Single Choice",
      shortanswer: "Short Answer",
    };

    return (
      <div className="text-center py-12 text-muted-foreground">
        <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Questions Found</h3>
        <p>No {filterLabels[activeFilter] || activeFilter} questions found in this collection.</p>
        <p className="text-sm mt-1">Total questions in collection: {statistics.totalQuestions}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {paginatedQuestions.map((question, idx) => (
          <MemoQuestionCard
            key={question.id}
            question={question}
            index={(question.position ?? idx) + 1}
            viewOnly={true}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
        </div>
      )}
    </>
  );
}

export function QuestionsTab({ selectedCollection }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (selectedCollection) {
      loadCollection();
    } else {
      setCollection(null);
      setError(null);
    }
  }, [selectedCollection]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await collectionAPI.getCollection(selectedCollection);
      setCollection(response.data);
    } catch (error) {
      console.error("Failed to load collection:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const statistics = useMemo(() => {
    if (!collection?.questions?.length) {
      return {
        totalQuestions: 0,
        totalWeight: 0,
        questionTypes: { mcq: 0, singlechoice: 0, shortanswer: 0 },
      };
    }

    const totalQuestions = collection.questions.length;
    const totalWeight = collection.questions.reduce((sum, q) => sum + (q.weight || 1), 0);
    const questionTypes = collection.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, { mcq: 0, singlechoice: 0, shortanswer: 0 });

    return { totalQuestions, totalWeight, questionTypes };
  }, [collection?.questions]);

  const filteredQuestions = useMemo(() => {
    if (!collection?.questions?.length) return [];
    if (activeFilter === "all") {
      return collection.questions;
    }
    return collection.questions.filter((q) => q.type === activeFilter);
  }, [collection?.questions, activeFilter]);

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedQuestions,
    goToPage,
  } = usePagination(filteredQuestions, 10);

  const filterTabs = useMemo(
    () => [
      { key: "all", label: "All Questions", count: statistics.totalQuestions, icon: <FileQuestion className="h-4 w-4" /> },
      { key: "mcq", label: "Multiple Choice", count: statistics.questionTypes.mcq, icon: <CheckCircle2 className="h-4 w-4" /> },
      { key: "singlechoice", label: "Single Choice", count: statistics.questionTypes.singlechoice, icon: <CircleDot className="h-4 w-4" /> },
      { key: "shortanswer", label: "Short Answer", count: statistics.questionTypes.shortanswer, icon: <FileText className="h-4 w-4" /> },
    ],
    [statistics],
  );

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    goToPage(1);
  };

  if (!selectedCollection) {
    return <QuestionsStateHandler state="no-collection" />;
  }

  if (loading) {
    return <QuestionsStateHandler state="loading" />;
  }

  if (error) {
    return <QuestionsStateHandler state="error" />;
  }

  if (!collection?.questions?.length) {
    return <QuestionsStateHandler state="no-questions" selectedCollection={selectedCollection} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {collection?.title || 'Collection Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collection?.description && <p className="text-muted-foreground mb-6">{collection.description}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <FileQuestion className="h-5 w-5 text-foreground" />
                <span className="font-medium">Total Questions</span>
              </div>
              <p className="text-2xl font-bold">{statistics.totalQuestions}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Weight className="h-5 w-5 text-foreground" />
                <span className="font-medium">Total Weight</span>
              </div>
              <p className="text-2xl font-bold">{statistics.totalWeight} {statistics.totalWeight === 1 ? 'point' : 'points'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b pb-4">
            {filterTabs.map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant={activeFilter === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(tab.key)}
                className="flex items-center gap-2"
              >
                {tab.icon}
                {tab.label}
                <Badge variant={activeFilter === tab.key ? "secondary" : "outline"} className="ml-1 text-xs">
                  {tab.count}
                </Badge>
              </Button>
            ))}
          </div>

          <QuestionsContent
            filteredQuestions={filteredQuestions}
            activeFilter={activeFilter}
            statistics={statistics}
            paginatedQuestions={paginatedQuestions}
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
