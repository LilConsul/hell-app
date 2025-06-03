import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  Calendar,
  User,
  Target,
  RotateCcw,
  Eye,
  FileText,
  Play,
  Mail,
  CheckCircle,
  Clock
} from "lucide-react";
import { ExamConfirmationModal } from "@/components/exams/student/handle-exams";
import { StatusBadge } from "@/components/exams/status-badge";
import { useExamStatus } from "@/hooks/use-student-exam-status";

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
  const navigate = useNavigate();
  const { getExamStatus, getStatusConfig, getSecurityFeatureStatus } = useExamStatus();
  
  // Single memoized calculation for all exam data
  const examMeta = useMemo(() => {
    const status = exam.derivedStatus || getExamStatus(exam);
    const now = new Date();
    const startDate = new Date(exam.exam_instance_id.start_date);
    const endDate = new Date(exam.exam_instance_id.end_date);
    const hasAttempted = exam.attempts_count > 0;
    const attemptsLeft = exam.exam_instance_id.max_attempts - exam.attempts_count;
    const isActive = now >= startDate && now <= endDate;
    const isOverdue = now > endDate;
    const isPending = now < startDate;
    
    return {
      status,
      statusConfig: getStatusConfig(status),
      hasAttempted,
      attemptsLeft,
      isActive,
      isOverdue,
      isPending,
      canTakeAction: isActive && (status === 'not_started' || status === 'active' || 
                     (status === 'submitted' && attemptsLeft > 0) || status === 'in_progress'),
      securityFeatures: getSecurityFeatureStatus?.(exam.exam_instance_id.security_settings) || [],
      instructor: exam.exam_instance_id.created_by
    };
  }, [exam, getExamStatus, getStatusConfig, getSecurityFeatureStatus]);

  // Simplified action handlers
  const handlePrimaryAction = () => {
    if (!examMeta.canTakeAction) return;
    setShowConfirmModal(true);
  };

  const handleConfirmStart = () => {
    setShowConfirmModal(false);
    if (examMeta.status === "in_progress") {
      onResumeExam?.(exam.id);
    } else {
      onStartExam?.(exam.id);
    }
  };

  const handleContact = () => {
    const email = examMeta.instructor?.email;
    if (email) {
      const subject = encodeURIComponent(`Exam Inquiry: ${exam.exam_instance_id.title}`);
      window.open(`mailto:${email}?subject=${subject}`, '_blank');
    }
  };

  // Simplified button configuration
  const getPrimaryButton = () => {
    const { status, canTakeAction, isActive, hasAttempted, attemptsLeft } = examMeta;
    
    if (status === 'completed') return { text: 'Completed', icon: CheckCircle, disabled: true };
    if (status === 'in_progress' && isActive) return { text: 'Resume Exam', icon: Play, disabled: false };
    if (status === 'submitted' && attemptsLeft > 0 && isActive) return { text: 'Retake Exam', icon: RotateCcw, disabled: false };
    if (status === 'submitted') return { text: 'Submitted', icon: CheckCircle, disabled: true };
    if ((status === 'not_started' || status === 'active') && isActive) return { text: 'Start Exam', icon: Play, disabled: false };
    if (status === 'overdue' && !hasAttempted) return { text: 'Contact', icon: Mail, disabled: false, isContact: true };
    if (status === 'overdue') return { text: 'Overdue', icon: Clock, disabled: true };
    
    return { text: 'Not Available', icon: Clock, disabled: true };
  };

  const primaryButton = getPrimaryButton();

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <StatusBadge 
              config={examMeta.statusConfig}
              size="default"
              showIcon
              showBadge
            />
            <h3 className="text-lg font-semibold text-foreground line-clamp-2">
              {exam.exam_instance_id.title}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{examMeta.instructor?.first_name} {examMeta.instructor?.last_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{exam.exam_instance_id.passing_score}% to pass</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Start Date</span>
              </div>
              <div className="font-medium">{formatDate(exam.exam_instance_id.start_date)}</div>
              <div className="text-xs text-muted-foreground">{formatTime(exam.exam_instance_id.start_date)}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Due Date</span>
              </div>
              <div className="font-medium">{formatDate(exam.exam_instance_id.end_date)}</div>
              <div className="text-xs text-muted-foreground">{formatTime(exam.exam_instance_id.end_date)}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <RotateCcw className="h-3 w-3" />
                <span>Attempts</span>
              </div>
              <div className="font-medium">{exam.attempts_count} / {exam.exam_instance_id.max_attempts}</div>
              <div className="text-xs text-muted-foreground">{examMeta.attemptsLeft} remaining</div>
            </div>
          </div>

          {examMeta.securityFeatures.length > 0 && (
            <div className="pt-3 border-t">
              <div className="flex flex-wrap gap-2">
                {examMeta.securityFeatures.map((feature, index) => (
                  <StatusBadge 
                    key={index}
                    config={getStatusConfig(feature)}
                    size="xs"
                    showIcon
                    showBadge
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-3">
          <Button 
            onClick={() => navigate(`/exams/${exam.id}`)}
            variant="outline"
            className="flex-1"
          >
            {examMeta.hasAttempted ? <Eye className="h-4 w-4 mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            {examMeta.hasAttempted ? 'View Results' : 'View Details'}
          </Button>
          
          {primaryButton.isContact ? (
            <Button 
              onClick={handleContact}
              variant="outline"
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact {examMeta.instructor?.email || 'Instructor'}
            </Button>
          ) : (
            <Button 
              onClick={primaryButton.disabled ? undefined : handlePrimaryAction}
              disabled={primaryButton.disabled}
              variant={primaryButton.disabled ? "outline" : "default"}
              className="flex-1"
            >
              <primaryButton.icon className="h-4 w-4 mr-2" />
              {primaryButton.text}
            </Button>
          )}
        </CardFooter>
      </Card>

      <ExamConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmStart}
        examTitle={exam.exam_instance_id.title}
        isResuming={examMeta.status === "in_progress"}
        attemptsRemaining={examMeta.attemptsLeft}
      />
    </>
  );
}