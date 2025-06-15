import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useExamStatus } from "@/hooks/use-student-exam-status";
import { StatusBadge } from "@/components/exams/status-badge";

export function ExamDetailsHeader({ exam }) {
  const navigate = useNavigate();
  const { getExamStatus, getStatusConfig } = useExamStatus();
  
  const examStatus = getExamStatus(exam);
  const statusConfig = getStatusConfig(examStatus);

  const handleBackClick = () => {
    navigate('/exams');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            onClick={handleBackClick}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
            {exam.exam_instance_id.title}
          </h1>
        </div>

        <div className="flex-shrink-0">
          <StatusBadge 
            config={statusConfig}
            showIcon={true}
            showBadge={true}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}