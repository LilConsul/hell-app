import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/exams/status-badge";
import { useExamStatus } from "@/hooks/use-student-exam-status";

function ExamResultsOverlay({ results, onNavigateBack }) {
  const { getStatusConfig } = useExamStatus();
  
  const passFailStatus = results.pass_fail;
  const passFailConfig = passFailStatus ? getStatusConfig(passFailStatus) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Exam Completed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold text-green-600">
            {results.grade !== undefined ? `${Math.round(results.grade)}%` : 'Submitted'}
          </div>
          {passFailConfig && (
            <StatusBadge 
              config={passFailConfig} 
              size="lg" 
              showIcon={true} 
              showBadge={true} 
            />
          )}
          <p className="text-muted-foreground">
            Your exam has been submitted successfully.
          </p>
          <Button 
            onClick={onNavigateBack}
            className="mt-4"
          >
            Back to Exam Details
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExamResultsOverlay;