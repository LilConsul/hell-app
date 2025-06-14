import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Target,
  ArrowLeft
} from "lucide-react";
import { StatusBadge } from "@/components/exams/status-badge";
import { useExamStatus } from "@/hooks/use-student-exam-status";

export function AttemptSelectorForExplorerUsers({ 
  exam, 
  onSelectAttempt, 
  onBackToExamDetails 
}) {
  const { 
    getAttemptStatusConfig,
    getPassFailConfig,
    formatDateTime
  } = useExamStatus();

  const roundScore = (score) => {
    if (score === null || score === undefined) return null;
    return Math.round(score * 100) / 100;
  };

  const getAttemptNumber = (attempt, allAttempts) => {
    const sortedAttempts = [...allAttempts].sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
    const chronologicalIndex = sortedAttempts.findIndex(a => a.id === attempt.id);
    return allAttempts.length - chronologicalIndex;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select an Attempt to View Results
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToExamDetails}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Exam
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground mb-4">
            Choose an attempt from the list below to view detailed results.
          </p>
          
          <div className="space-y-3">
            {exam.attempts
              .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
              .map((attempt) => {
                const statusConfig = getAttemptStatusConfig(attempt.status);
                const passFailConfig = attempt.pass_fail ? getPassFailConfig(attempt.pass_fail) : null;
                const attemptNumber = getAttemptNumber(attempt, exam.attempts);
                const roundedGrade = roundScore(attempt.grade);
                const canView = attempt.status === 'submitted';

                return (
                  <div
                    key={attempt.id}
                    className={`border rounded-lg p-4 ${
                      canView 
                        ? 'cursor-pointer hover:bg-muted/50 transition-colors' 
                        : 'opacity-60'
                    }`}
                    onClick={() => canView && onSelectAttempt(attempt.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-lg">
                          Attempt {attemptNumber}
                        </span>
                        <StatusBadge 
                          config={statusConfig}
                          showIcon={false}
                          showBadge={true}
                          size="sm"
                        />
                        {passFailConfig && (
                          <StatusBadge 
                            config={passFailConfig}
                            showIcon={false}
                            showBadge={true}
                            size="sm"
                          />
                        )}
                      </div>
                      
                      {roundedGrade !== null && (
                        <Badge variant="outline">
                          {roundedGrade}%
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Started:</span> {formatDateTime(attempt.started_at)}
                      </div>
                      {attempt.submitted_at && (
                        <div>
                          <span className="font-medium">Submitted:</span> {formatDateTime(attempt.submitted_at)}
                        </div>
                      )}
                    </div>
                    
                    {!canView && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        This attempt is still in progress
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}