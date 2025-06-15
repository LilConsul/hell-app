import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/exams/status-badge";
import { useExamStatus } from "@/hooks/use-student-exam-status";
import { 
  Calendar, 
  Clock, 
  Target, 
  RotateCcw, 
  FileText,
  Settings,
  Shield,
  Copy
} from "lucide-react";

export function ExamDetailsInfo({ exam }) {
  const { 
    getTimeStatus, 
    getStatusConfig, 
    getSecurityFeatureStatus,
    formatDateTimeDetailed 
  } = useExamStatus();

  const startDateTime = formatDateTimeDetailed(exam.exam_instance_id.start_date);
  const endDateTime = formatDateTimeDetailed(exam.exam_instance_id.end_date);
  
  const timeStatus = getTimeStatus(exam.exam_instance_id.start_date, exam.exam_instance_id.end_date);
  const timeStatusConfig = getStatusConfig(timeStatus);
  const securitySettings = exam.exam_instance_id.security_settings;
  const securityFeatures = getSecurityFeatureStatus(securitySettings);
  
  const attemptsRemaining = exam.exam_instance_id.max_attempts - exam.attempts_count;

  const copyEmailToClipboard = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success(`Email copied to clipboard: ${email}`);
    } catch (err) {
      toast.error("Failed to copy email to clipboard");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exam Information
            </div>
            <StatusBadge 
              config={timeStatusConfig}
              size="sm"
              showIcon={false}
              showBadge={true}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                Start Date & Time
              </div>
              <div className="font-medium">{startDateTime.date}</div>
              <div className="text-sm text-muted-foreground">{startDateTime.time}</div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                Due Date & Time
              </div>
              <div className="font-medium">{endDateTime.date}</div>
              <div className="text-sm text-muted-foreground">{endDateTime.time}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Target className="h-3 w-3" />
                Passing Score
              </div>
              <div className="font-medium">{exam.exam_instance_id.passing_score}%</div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileText className="h-3 w-3" />
                Questions
              </div>
              <div className="font-medium">{exam.question_count || 'N/A'}</div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <RotateCcw className="h-3 w-3" />
              Attempts
            </div>
            <div className="font-medium">
              {exam.attempts_count} / {exam.exam_instance_id.max_attempts}
            </div>
            <div className="text-sm text-muted-foreground">
              {attemptsRemaining} remaining
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Exam Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Shield className="h-3 w-3" />
              Security Features
            </div>
            <div className="flex flex-wrap gap-2">
              {securityFeatures.map((feature, index) => {
                const config = getStatusConfig(feature);
                return (
                  <StatusBadge 
                    key={index}
                    config={config}
                    size="xs"
                    showIcon={true}
                    showBadge={true}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-1">Instructor</div>
            <div className="font-medium">
              {exam.exam_instance_id.created_by?.first_name} {exam.exam_instance_id.created_by?.last_name}
            </div>
            <Button 
              variant="link" 
              size="sm" 
              className="!p-0 h-auto text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => copyEmailToClipboard(exam.exam_instance_id.created_by?.email)}
            >
              {exam.exam_instance_id.created_by?.email}
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}