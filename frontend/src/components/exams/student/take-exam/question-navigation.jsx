import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag } from "lucide-react";

function QuestionNavigation({ 
  questions, 
  answers, 
  flaggedQuestions, 
  currentQuestionIndex, 
  unsavedQuestions,
  onGoToQuestion 
}) {
  return (
    <Card className="sticky top-32">
      <CardHeader>
        <CardTitle className="text-base">Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(2.5rem,1fr))] gap-2">
          {questions?.map((question, index) => {
            const answer = answers[question.id];
            const isAnswered = answer !== undefined && answer !== '' && answer !== null && 
                              (Array.isArray(answer) ? answer.length > 0 : true);
            const isFlagged = flaggedQuestions.has(question.id);
            const isUnsaved = unsavedQuestions.has(question.id);
            const isCurrent = index === currentQuestionIndex;
            
            let buttonClasses = "relative h-10 w-10 p-0 border";
            
            if (isCurrent) {
              buttonClasses += " bg-primary text-primary-foreground border-primary";
            } else if (isUnsaved) {
              buttonClasses += " border-amber-300 text-amber-800 bg-amber-50 dark:border-amber-700 dark:text-amber-200 dark:bg-amber-900/50";
            } else if (isAnswered) {
              buttonClasses += " border-green-300 text-green-800 bg-green-50 dark:border-green-700 dark:text-green-200 dark:bg-green-900/50";
            } else {
              buttonClasses += " border-gray-300 text-gray-800 bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800";
            }
            
            if (isFlagged) {
              buttonClasses += " ring-2 ring-amber-500";
            }
            
            return (
              <button
                key={question.id}
                className={buttonClasses}
                onClick={() => onGoToQuestion(index)}
              >
                {index + 1}
                {isFlagged && (
                  <Flag className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 fill-amber-500" />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/50 border rounded"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/50 border rounded"></div>
            <span>Unsaved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 border rounded"></div>
            <span>Not answered</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="w-3 h-3 text-amber-500" />
            <span>Flagged</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default QuestionNavigation;