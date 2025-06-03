import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Timer,
  TrendingUp
} from "lucide-react";

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true 
  });
};

const getStatusConfig = (status) => {
  const configs = {
    not_started: {
      badge: { variant: "secondary", text: "Not Started" },
      icon: Clock,
      color: "text-gray-500"
    },
    in_progress: {
      badge: { variant: "default", text: "In Progress" },
      icon: Timer,
      color: "text-blue-500"
    },
    submitted: {
      badge: { variant: "outline", text: "Submitted" },
      icon: CheckCircle,
      color: "text-orange-500"
    },
    completed: {
      badge: { variant: "default", text: "Completed" },
      icon: CheckCircle,
      color: "text-green-500"
    }
  };
  return configs[status] || configs.not_started;
};

const getPassFailConfig = (passFail) => {
  if (passFail === "pass") {
    return {
      badge: { variant: "default", text: "Pass" },
      icon: CheckCircle,
      color: "text-green-500"
    };
  } else if (passFail === "fail") {
    return {
      badge: { variant: "destructive", text: "Fail" },
      icon: XCircle,
      color: "text-red-500"
    };
  }
  return null;
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return null;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;
  
  const minutes = Math.floor(durationMs / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const calculateTimeRemaining = (startTime, examEndDate) => {
  if (!startTime || !examEndDate) return null;
  
  const now = new Date();
  const endDate = new Date(examEndDate);
  const timeLeft = endDate - now;
  
  if (timeLeft <= 0) return "Time expired";
  
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};

const calculateAverage = (attempts) => {
  if (!attempts || attempts.length === 0) return null;
  
  const gradesWithValues = attempts.filter(attempt => 
    attempt.grade !== null && attempt.grade !== undefined
  );
  
  if (gradesWithValues.length === 0) return null;
  
  const sum = gradesWithValues.reduce((acc, attempt) => acc + attempt.grade, 0);
  return Math.round(sum / gradesWithValues.length);
};

const getHighestGrade = (attempts) => {
  if (!attempts || attempts.length === 0) return null;
  
  const gradesWithValues = attempts.filter(attempt => 
    attempt.grade !== null && attempt.grade !== undefined
  );
  
  if (gradesWithValues.length === 0) return null;
  
  return Math.max(...gradesWithValues.map(attempt => attempt.grade));
};

export function ExamDetailsAttempts({ exam, onViewAttempt }) {
  const navigate = useNavigate();

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

  // Add toast msg for attempt number click
  const handleAttemptNumberClick = (attempt) => {
    if (attempt.status === 'submitted' && allowReview) {
      handleViewAttempt(attempt.id);
    } else {
      toast.error("Instructor has disabled viewing results for this exam.");
    }
  };


  // Calculate attempt number based on time
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
        {/* Score Summary */}
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

        {/* Attempts List */}
        <div className="space-y-4">
          {displayAttempts.map((attempt) => {
            const statusConfig = getStatusConfig(attempt.status);
            const passFailConfig = getPassFailConfig(attempt.pass_fail);
            const StatusIcon = statusConfig.icon;
            const duration = calculateDuration(attempt.started_at, attempt.submitted_at);
            const timeRemaining = attempt.status === 'in_progress' 
              ? calculateTimeRemaining(attempt.started_at, exam.exam_instance_id.end_date)
              : null;
            const attemptNumber = getAttemptNumber(attempt);
            const canViewResults = attempt.status === 'submitted' && allowReview;

            return (
              <div key={attempt.id} className="border rounded-lg p-4 space-y-3">
                {/* Attempt Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
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
                    <Badge variant={statusConfig.badge.variant} className="text-xs">
                      {statusConfig.badge.text}
                    </Badge>
                  </div>
                  
                  {/* Pass/Fail Badge */}
                  {passFailConfig && (
                    <Badge variant={passFailConfig.badge.variant} className="text-xs">
                      {passFailConfig.badge.text}
                    </Badge>
                  )}
                </div>

                {/* Attempt Details */}
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

                {/* Action Button */}
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



        {/* Review Notice */}
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