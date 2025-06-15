import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

function SubmitConfirmationModal({ isOpen, onConfirm, onCancel, answeredCount, totalQuestions }) {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Submit Exam
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to submit your exam?
            </p>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Answered:</span> {answeredCount}/{totalQuestions}</p>
              {unansweredCount > 0 && (
                <p className="text-amber-600">
                  <span className="font-medium">Unanswered:</span> {unansweredCount} questions
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              This action cannot be undone. Once submitted, you will not be able to make any changes.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              className="min-w-[100px]"
            >
              Submit Exam
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SubmitConfirmationModal;