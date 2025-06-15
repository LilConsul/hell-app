import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, Save, CheckCircle, Send, AlertCircle } from "lucide-react";

export function SubmitConfirmationModal({ isOpen, onConfirm, onCancel, answeredCount, totalQuestions, isSubmitting = false, submitProgress = 0 }) {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Send className="h-5 w-5 text-blue-500" />
                Submitting Exam
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Submit Exam
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isSubmitting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Send className="h-5 w-5 animate-pulse text-blue-500" />
                <span className="text-sm font-medium">Submitting exam...</span>
              </div>
              
              <Progress value={submitProgress} className="h-2" />
              
              <p className="text-xs text-muted-foreground">
                Please wait while we submit your exam
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AutoSubmitModal({ 
  isOpen, 
  saveProgress = 0, 
  submitProgress = 0, 
  currentlySaving = 0, 
  totalToSave = 0, 
  isSubmitting = false, 
  error = null,
  onGoToExamDetails 
}) {
  if (!isOpen) return null;

  const formatSaveProgress = () => {
    if (totalToSave === 0) return "No answers to save";
    return `Saving answer ${currentlySaving} of ${totalToSave}`;
  };

  const getProgressValue = () => {
    if (isSubmitting) return submitProgress;
    return saveProgress;
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (isSubmitting) return <Send className="h-5 w-5 animate-pulse text-blue-500" />;
    if (saveProgress === 100 && !isSubmitting) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Save className="h-5 w-5 animate-spin text-blue-500" />;
  };

  const getStatusText = () => {
    if (error) return "Submission Failed";
    if (isSubmitting) return "Submitting Exam";
    if (saveProgress === 100 && !isSubmitting) return "Answers Saved";
    return "Saving Answers";
  };

  const getSubStatusText = () => {
    if (error) return null;
    if (isSubmitting) return "Submitting exam...";
    if (saveProgress === 100 && !isSubmitting) return "Preparing to submit...";
    return formatSaveProgress();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-red-500" />
            Time's Up - Auto Submitting
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {error ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium text-red-600">
                    {getStatusText()}
                  </span>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                    {error}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    Please contact your instructor for assistance.
                  </p>
                </div>

                <Button 
                  onClick={onGoToExamDetails}
                  variant="outline"
                  className="w-full"
                >
                  Go to Exam Details
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">
                    {getStatusText()}
                  </span>
                </div>
                
                <Progress value={getProgressValue()} className="h-2" />
                
                {getSubStatusText() && (
                  <p className="text-xs text-muted-foreground">
                    {getSubStatusText()}
                  </p>
                )}
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Your exam is being automatically submitted due to time expiration.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}