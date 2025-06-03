import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Calendar,
  Copy
} from "lucide-react";
import { ExamConfirmationModal } from "@/components/exams/student/handle-exams";

export function ExamDetailsActions({ exam, onStartExam, onResumeExam }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('start');
  const navigate = useNavigate();
  
  const now = new Date();
  const startDate = new Date(exam.exam_instance_id.start_date);
  const endDate = new Date(exam.exam_instance_id.end_date);
  const isBeforeStart = now < startDate;
  const isAfterEnd = now > endDate;
  const isBetween = now >= startDate && now <= endDate;
  
  const hasAttempted = exam.attempts_count > 0;
  const attemptsRemaining = exam.exam_instance_id.max_attempts - exam.attempts_count;

  const copyEmailToClipboard = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success(`Email copied to clipboard: ${email}`);
    } catch (err) {
      toast.error("Failed to copy email to clipboard");
    }
  };

  const getPrimaryAction = () => {
    if (exam.current_status === "completed") {
      return {
        text: "Exam Completed",
        icon: CheckCircle,
        disabled: true,
        variant: "outline",
        description: "You have completed this exam.",
        action: null
      };
    }

    if (exam.current_status === "in_progress") {
      return {
        text: isBetween ? "Resume Exam" : "Resume Not Available",
        icon: isBetween ? Play : Clock,
        disabled: !isBetween,
        variant: isBetween ? "default" : "outline",
        description: isBetween 
          ? "Continue where you left off." 
          : "Exam time window has ended.",
        action: isBetween ? () => {
          setActionType('resume');
          setShowConfirmModal(true);
        } : null
      };
    }

    if (exam.current_status === "submitted" && attemptsRemaining > 0) {
      return {
        text: isBetween ? "Retake Exam" : "Retake Not Available",
        icon: isBetween ? RotateCcw : Clock,
        disabled: !isBetween,
        variant: isBetween ? "default" : "outline",
        description: isBetween 
          ? `You have ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining.`
          : "Exam time window has ended.",
        action: isBetween ? () => {
          setActionType('start');
          setShowConfirmModal(true);
        } : null
      };
    }

    if (isBeforeStart) {
      const timeUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      return {
        text: "Exam Not Started",
        icon: Calendar,
        disabled: true,
        variant: "outline",
        description: `Exam starts in ${timeUntilStart} day${timeUntilStart > 1 ? 's' : ''}.`,
        action: null
      };
    }

    if (isAfterEnd && !hasAttempted) {
      return {
        text: "Copy Instructor Email",
        icon: Copy,
        disabled: false,
        variant: "outline",
        description: "Exam time has ended. Contact your instructor for assistance.",
        action: () => {
          const email = exam.exam_instance_id.created_by?.email;
          if (email) {
            copyEmailToClipboard(email);
          }
        }
      };
    }

    if (isBetween && exam.current_status === "not_started") {
      return {
        text: "Start Exam",
        icon: Play,
        disabled: false,
        variant: "default",
        description: "Begin your exam attempt.",
        action: () => {
          setActionType('start');
          setShowConfirmModal(true);
        }
      };
    }

    return {
      text: "Not Available",
      icon: Clock,
      disabled: true,
      variant: "outline",
      description: "This exam is currently not available.",
      action: null
    };
  };

  const primaryAction = getPrimaryAction();
  const PrimaryIcon = primaryAction.icon;

  const handleConfirmAction = () => {
    setShowConfirmModal(false);
    
    if (actionType === 'resume') {
      navigate(`/exams/${exam.id}/take`, {
        state: {
          attemptId: exam.latest_attempt_id,
          examTitle: exam.exam_instance_id.title,
          isResuming: true
        }
      });
      onResumeExam?.();
    } else {
      navigate(`/exams/${exam.id}/take`, {
        state: {
          examTitle: exam.exam_instance_id.title,
          isResuming: false,
          attemptsRemaining: attemptsRemaining - 1
        }
      });
      onStartExam?.();
    }
  };

  return (
    <>
      <div className="space-y-3">
        <Button 
          onClick={primaryAction.action}
          disabled={primaryAction.disabled}
          variant={primaryAction.variant}
          size="lg"
          className="w-full"
        >
          <PrimaryIcon className="h-5 w-5 mr-2" />
          {primaryAction.text}
        </Button>
        
        {primaryAction.description && (
          <p className="text-sm text-muted-foreground text-center">
            {primaryAction.description}
          </p>
        )}
      </div>

      <ExamConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAction}
        examTitle={exam.exam_instance_id.title}
        isResuming={actionType === 'resume'}
        attemptsRemaining={attemptsRemaining}
      />
    </>
  );
}