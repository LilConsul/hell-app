import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  PauseCircle, 
  Calendar,
  User,
  Target,
  RotateCcw,
  Eye,
  AlertTriangle,
  Shield,
  Settings,
  FileText,
  Play,
  Mail
} from "lucide-react";
import { ExamConfirmationModal } from "@/components/exams/student/handle-exams";

const getStatusConfig = (status) => {
  const configs = {
    not_started: {
      badge: { variant: "secondary", text: "Not Started" },
      icon: PlayCircle,
      color: "text-gray-500 dark:text-gray-400"
    },
    in_progress: {
      badge: { variant: "default", text: "In Progress" },
      icon: PauseCircle,
      color: "text-blue-500 dark:text-blue-400"
    },
    submitted: {
      badge: { variant: "outline", text: "Submitted" },
      icon: Clock,
      color: "text-orange-500 dark:text-orange-400"
    },
    completed: {
      badge: { variant: "default", text: "Completed" },
      icon: CheckCircle,
      color: "text-green-500 dark:text-green-400"
    }
  };
  return configs[status] || configs.not_started;
};

const getTimeStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) {
    return {
      status: "upcoming",
      text: `Starts soon`,
      color: "text-blue-600 dark:text-blue-400",
      icon: Calendar
    };
  } else if (now > end) {
    return {
      status: "overdue",
      text: `Ended`,
      color: "text-red-500 dark:text-red-400",
      icon: AlertTriangle
    };
  } else {
    return {
      status: "active",
      text: `Active`,
      color: "text-green-600 dark:text-green-400",
      icon: Clock
    };
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export function ExamCard({ exam, onStartExam, onResumeExam }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const now = new Date();
  const startDate = new Date(exam.exam_instance_id.start_date);
  const endDate = new Date(exam.exam_instance_id.end_date);
  const isBeforeStart = now < startDate;
  const isAfterEnd = now > endDate;
  const isBetween = now >= startDate && now <= endDate;
  
  const statusConfig = getStatusConfig(exam.current_status);
  const timeStatus = getTimeStatus(
    exam.exam_instance_id.start_date, 
    exam.exam_instance_id.end_date
  );
  const StatusIcon = statusConfig.icon;
  const TimeIcon = timeStatus.icon;

  const hasAttempted = exam.attempts_count > 0;
  const attemptsRemaining = exam.exam_instance_id.max_attempts - exam.attempts_count;

  // Left button configuration
  const getLeftButtonConfig = () => {
    if (hasAttempted) {
      return {
        text: "View Results",
        icon: Eye,
        action: () => window.location.href = `https://localhost/exams/${exam.id}`
      };
    }
    return {
      text: "View Details", 
      icon: FileText,
      action: () => window.location.href = `https://localhost/exams/${exam.id}`
    };
  };

  // Right button configuration
  const getRightButtonConfig = () => {
    if (exam.current_status === "completed") {
      return {
        text: "Completed",
        icon: CheckCircle,
        disabled: true,
        action: null
      };
    }

    // If in progress show resume (only if between dates)
    if (exam.current_status === "in_progress") {
      return {
        text: isBetween ? "Resume Exam" : "Not Available",
        icon: isBetween ? Play : Clock,
        disabled: !isBetween,
        action: isBetween ? () => setShowConfirmModal(true) : null
      };
    }

    // If submitted and has attempts remaining
    if (exam.current_status === "submitted" && attemptsRemaining > 0) {
      return {
        text: isBetween ? "Retake Exam" : "Not Available",
        icon: isBetween ? RotateCcw : Clock,
        disabled: !isBetween,
        action: isBetween ? () => setShowConfirmModal(true) : null
      };
    }

    // If before start date
    if (isBeforeStart) {
      return {
        text: "Not Available Yet",
        icon: Calendar,
        disabled: true,
        action: null
      };
    }

    // If after end date and not attempted
    if (isAfterEnd && !hasAttempted) {
      return {
        text: `Contact ${exam.exam_instance_id.created_by?.email || 'Instructor'}`,
        icon: Mail,
        disabled: true,
        action: null
      };
    }

    // If between dates and not started
    if (isBetween && exam.current_status === "not_started") {
      return {
        text: "Start Exam",
        icon: Play,
        disabled: false,
        action: () => setShowConfirmModal(true)
      };
    }

    // Default fallback
    return {
      text: "Not Available",
      icon: Clock,
      disabled: true,
      action: null
    };
  };

  const leftButtonConfig = getLeftButtonConfig();
  const rightButtonConfig = getRightButtonConfig();

  const handleConfirmStart = () => {
    setShowConfirmModal(false);
    
    if (exam.current_status === "in_progress") {
      onResumeExam?.(exam.id);
    } else {
      onStartExam?.(exam.id);
    }
  };

  // Active security features
  const securityFeatures = exam.exam_instance_id.security_settings;
  const hasSecurityFeatures = securityFeatures?.shuffle_questions || 
                              securityFeatures?.prevent_tab_switching || 
                              securityFeatures?.allow_review;

  return (
    <>
      <Card className="transition-all duration-200 hover:shadow-md border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusConfig.color}`} />
                <Badge variant={statusConfig.badge.variant}>
                  {statusConfig.badge.text}
                </Badge>
                {timeStatus.status === "overdue" && (
                  <Badge variant="outline" className="text-xs border-red-300 text-red-700 dark:border-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950">
                    Overdue
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold leading-tight mb-1 truncate text-foreground">
                {exam.exam_instance_id.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {exam.exam_instance_id.created_by?.first_name} {exam.exam_instance_id.created_by?.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 flex-shrink-0" />
                  <span>{exam.exam_instance_id.passing_score}% to pass</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>Start Date</span>
              </div>
              <div className="font-medium text-foreground">
                {formatDate(exam.exam_instance_id.start_date)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(exam.exam_instance_id.start_date)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <TimeIcon className={`h-3 w-3 flex-shrink-0 ${timeStatus.color}`} />
                <span>Due Date</span>
              </div>
              <div className="font-medium text-foreground">
                {formatDate(exam.exam_instance_id.end_date)}
              </div>
              <div className={`text-xs ${timeStatus.color}`}>
                {timeStatus.text}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <RotateCcw className="h-3 w-3 flex-shrink-0" />
                <span>Attempts</span>
              </div>
              <div className="font-medium text-foreground">
                {exam.attempts_count} / {exam.exam_instance_id.max_attempts}
              </div>
              <div className="text-xs text-muted-foreground">
                {attemptsRemaining} remaining
              </div>
            </div>
          </div>

          {/* Security Settings */}
          {hasSecurityFeatures && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-2 items-center">
                {securityFeatures?.shuffle_questions && (
                  <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
                    <Settings className="h-3 w-3 mr-1" />
                    Shuffled Questions
                  </Badge>
                )}
                {securityFeatures?.prevent_tab_switching && (
                  <Badge variant="outline" className="text-xs border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                    <Shield className="h-3 w-3 mr-1" />
                    Tab Switch Prevention
                  </Badge>
                )}
                {securityFeatures?.allow_review && (
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                    Review Allowed
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3">
          <div className="flex gap-3 w-full">
            {/* Left Button */}
            <Button 
              onClick={leftButtonConfig.action}
              variant="outline"
              className="flex-1"
            >
              <leftButtonConfig.icon className="h-4 w-4 mr-2" />
              {leftButtonConfig.text}
            </Button>
            
            {/* Right Button */}
            {isAfterEnd && !hasAttempted ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-sm text-muted-foreground mr-2">Contact</span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const email = exam.exam_instance_id.created_by?.email;
                    if (email) {
                      window.location.href = `mailto:${email}?subject=Exam Inquiry: ${exam.exam_instance_id.title}`;
                    }
                  }}
                >
                  {exam.exam_instance_id.created_by?.email || 'Instructor'}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={rightButtonConfig.action}
                disabled={rightButtonConfig.disabled}
                className={`flex-1 ${rightButtonConfig.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                variant={rightButtonConfig.disabled ? "outline" : "default"}
              >
                <rightButtonConfig.icon className="h-4 w-4 mr-2" />
                {rightButtonConfig.text}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <ExamConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmStart}
        examTitle={exam.exam_instance_id.title}
        isResuming={exam.current_status === "in_progress"}
        attemptsRemaining={attemptsRemaining}
      />
    </>
  );
}
