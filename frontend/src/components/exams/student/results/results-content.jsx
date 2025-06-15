import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, FileText, CheckCircle, XCircle, Circle, Flag, List } from "lucide-react";
import { QuestionResult } from "@/components/exams/student/results/question-result";
import { useState, useMemo } from "react";

const questionFilters = [
  { value: "all", label: "All Questions", icon: List },
  { value: "correct", label: "Correct", icon: CheckCircle },
  { value: "incorrect", label: "Incorrect", icon: XCircle },
  { value: "not_answered", label: "Not Answered", icon: Circle },
  { value: "flagged", label: "Flagged", icon: Flag },
];

export function ResultsContent({ attemptData }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const allowReview = attemptData.allow_review;
  
  // Categorize responses and calculate counts
  const { filteredResponses, filterCounts } = useMemo(() => {
    if (!attemptData.responses || attemptData.responses.length === 0) {
      return { filteredResponses: [], filterCounts: {} };
    }

    // Sort responses by question order if available
    const sortedResponses = [...attemptData.responses];
    
    if (attemptData.question_order && attemptData.question_order.length > 0) {
      sortedResponses.sort((a, b) => {
        const aIndex = attemptData.question_order.indexOf(a.question_id.id);
        const bIndex = attemptData.question_order.indexOf(b.question_id.id);
        
        // If question not found in order, put it at the end
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
    }

    // Categorize responses
    const counts = {
      all: sortedResponses.length,
      correct: 0,
      incorrect: 0,
      not_answered: 0,
      flagged: 0,
    };

    sortedResponses.forEach(response => {
      const isCorrect = response.score > 0;
      const hasAnswer = response.text_response !== null || 
                       (response.selected_option_ids && response.selected_option_ids.length > 0);

      if (response.is_flagged) {
        counts.flagged++;
      }
      
      if (isCorrect) {
        counts.correct++;
      } else if (hasAnswer) {
        counts.incorrect++;
      } else {
        counts.not_answered++;
      }
    });

    // Filter responses based on active filter
    let filtered = sortedResponses;
    
    if (activeFilter !== "all") {
      filtered = sortedResponses.filter(response => {
        const isCorrect = response.score > 0;
        const hasAnswer = response.text_response !== null || 
                         (response.selected_option_ids && response.selected_option_ids.length > 0);

        switch (activeFilter) {
          case "correct":
            return isCorrect;
          case "incorrect":
            return !isCorrect && hasAnswer;
          case "not_answered":
            return !hasAnswer;
          case "flagged":
            return response.is_flagged;
          default:
            return true;
        }
      });
    }

    return { 
      filteredResponses: filtered, 
      filterCounts: counts 
    };
  }, [attemptData.responses, attemptData.question_order, activeFilter]);

  if (!allowReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Review Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <EyeOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Detailed Review Disabled
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your instructor has disabled detailed review for this exam. You can see your overall score and attempt summary above, but individual question answers are not available for review.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attemptData.responses || attemptData.responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Question Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Responses Found
            </h3>
            <p className="text-muted-foreground">
              No question responses were recorded for this attempt.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Question Review ({attemptData.responses.length} Questions)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 pb-4 border-b">
          {questionFilters.map((filter) => {
            const Icon = filter.icon;
            const count = filterCounts[filter.value] || 0;
            
            return (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.value)}
                className="flex items-center gap-2"
                disabled={count === 0 && filter.value !== "all"}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Filtered Results */}
        {filteredResponses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Questions Found
            </h3>
            <p className="text-muted-foreground">
              No questions match the selected filter "{questionFilters.find(f => f.value === activeFilter)?.label}".
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResponses.map((response) => {
              // Calculate the original question number
              const originalIndex = attemptData.responses.findIndex(r => r.id === response.id);
              return (
                <QuestionResult
                  key={response.id}
                  response={response}
                  questionNumber={originalIndex + 1}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}