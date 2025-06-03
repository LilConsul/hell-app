import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  PlayCircle, 
  PauseCircle, 
  Clock,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

export function ExamDetailsHeader({ exam }) {
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(exam.current_status);
  const StatusIcon = statusConfig.icon;

  const handleBackClick = () => {
    navigate('/exams');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4">
        {/* Back Button and Title */}
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

        {/* Status Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          <Badge variant={statusConfig.badge.variant} className="text-sm">
            {statusConfig.badge.text}
          </Badge>
        </div>
      </div>
    </div>
  );
}