import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Timer,
  TrendingUp
} from "lucide-react";
import { StatusBadge } from "@/components/exams/status-badge";
import { useExamStatus } from "@/hooks/use-student-exam-status";

export function ExamDetailsAttempts({ exam, onViewAttempt }) {
  const navigate = useNavigate();
  const { 
    getAttemptStatusConfig,
    getPassFailConfig,
    formatDateTime,
    calculateDuration,
    calculateTimeRemaining,
    calculateAverage,
    getHighestGrade
  } = useExamStatus();

  if (!exam.attempts || exam.attempts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Exam Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Attempts Yet</h3>
            <p className="text-muted-foreground">
              You haven't started this exam yet. Click "Start Exam" when you're ready to begin.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allowReview = exam.exam_instance_id.security_settings?.allow_review;
  const sortedAttempts = [...exam.attempts].sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  const displayAttempts = sortedAttempts.slice(0, 3);
  const averageGrade = calculateAverage(exam.attempts);
  const highestGrade = getHighestGrade(exam.attempts);

  const handleViewAttempt = (attemptId) => {
    const attempt = exam.attempts.find(a => a.id === attemptId);
    navigate(`/exams/${exam.id}/results?attemptId=${attemptId}`, {
      state: {
        examTitle: exam.exam_instance_id.title,
        examId: exam.id,
        attemptId: attemptId,
        currentStatus: exam.current_status,
        attemptsCount: exam.attempts_count,
        latestAttemptId: exam.latest_attempt_id,
        attempts: exam.attempts,
        attempt: attempt
      }
    });
    onViewAttempt?.(attemptId);
  };

  const handleAttemptNumberClick = (attempt) => {
    if (attempt.status === 'submitted' && allowReview) {
      handleViewAttempt(attempt.id);
    } else {
      toast.error("Instructor has disabled viewing results for this exam.");
    }
  };

  const getAttemptNumber = (attempt) => {
    const chronologicalIndex = sortedAttempts.findIndex(a => a.id === attempt.id);
    return exam.attempts.length - chronologicalIndex;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Exam Attempts ({exam.attempts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(averageGrade !== null || highestGrade !== null) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {averageGrade !== null && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Average Score</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {averageGrade}%
                </div>
              </div>
            )}
            
            {highestGrade !== null && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Highest Score</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {highestGrade}%
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {displayAttempts.map((attempt) => {
            const statusConfig = getAttemptStatusConfig(attempt.status);
            const passFailConfig = attempt.pass_fail ? getPassFailConfig(attempt.pass_fail) : null;
            const duration = calculateDuration(attempt.started_at, attempt.submitted_at);
            const timeRemaining = attempt.status === 'in_progress' 
              ? calculateTimeRemaining(attempt.started_at, exam.exam_instance_id.end_date)
              : null;
            const attemptNumber = getAttemptNumber(attempt);
            const canViewResults = attempt.status === 'submitted' && allowReview;

            return (
              <div key={attempt.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span 
                      className={`font-medium ${
                        canViewResults 
                          ? 'cursor-pointer hover:underline' 
                          : 'cursor-default'
                      }`}
                      onClick={() => handleAttemptNumberClick(attempt)}
                    >
                      Attempt {attemptNumber}
                    </span>
                    <StatusBadge 
                      config={statusConfig}
                      showIcon={false}
                      showBadge={true}
                      size="sm"
                    />
                  </div>
                  
                  {passFailConfig && (
                    <StatusBadge 
                      config={passFailConfig}
                      showIcon={false}
                      showBadge={true}
                      size="sm"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Started</div>
                    <div className="font-medium">{formatDateTime(attempt.started_at)}</div>
                  </div>
                  
                  {attempt.submitted_at && (
                    <div>
                      <div className="text-muted-foreground mb-1">Submitted</div>
                      <div className="font-medium">{formatDateTime(attempt.submitted_at)}</div>
                    </div>
                  )}
                  
                  {attempt.grade !== null && attempt.grade !== undefined && (
                    <div>
                      <div className="text-muted-foreground mb-1">Score</div>
                      <div className="font-medium">{attempt.grade}%</div>
                    </div>
                  )}
                  
                  {duration && (
                    <div>
                      <div className="text-muted-foreground mb-1">Duration</div>
                      <div className="font-medium">{duration}</div>
                    </div>
                  )}
                  
                  {timeRemaining && attempt.status === 'in_progress' && (
                    <div>
                      <div className="text-muted-foreground mb-1">Time Left</div>
                      <div className="font-medium text-orange-600 dark:text-orange-400">
                        {timeRemaining}
                      </div>
                    </div>
                  )}
                </div>

                {attempt.status === 'submitted' && allowReview && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAttempt(attempt.id)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </div>
                )}

                {attempt.status === 'in_progress' && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      This attempt is currently in progress
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!allowReview && exam.attempts.some(a => a.status === 'submitted') && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Review Not Available</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Your instructor has disabled result review for this exam.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}