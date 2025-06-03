import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Target, 
  RotateCcw, 
  FileText,
  Settings,
  Shield,
  Eye,
  Copy
} from "lucide-react";

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    time: date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  };
};

const getTimeStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) {
    return {
      status: "upcoming",
      text: "Starts soon",
      color: "text-blue-600 dark:text-blue-400"
    };
  } else if (now > end) {
    return {
      status: "overdue", 
      text: "Ended",
      color: "text-red-500 dark:text-red-400"
    };
  } else {
    return {
      status: "active",
      text: "Active now",
      color: "text-green-600 dark:text-green-400"
    };
  }
};

export function ExamDetailsInfo({ exam }) {
  const startDateTime = formatDateTime(exam.exam_instance_id.start_date);
  const endDateTime = formatDateTime(exam.exam_instance_id.end_date);
  const timeStatus = getTimeStatus(exam.exam_instance_id.start_date, exam.exam_instance_id.end_date);
  
  const attemptsRemaining = exam.exam_instance_id.max_attempts - exam.attempts_count;
  const securitySettings = exam.exam_instance_id.security_settings;

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
            <Badge 
              variant="outline" 
              className={`text-xs ${timeStatus.status === 'active' ? 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300' : timeStatus.status === 'upcoming' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300' : 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-300'}`}
            >
              {timeStatus.text}
            </Badge>
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
              {securitySettings?.shuffle_questions ? (
                <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
                  Questions Shuffled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  Questions Not Shuffled
                </Badge>
              )}

              {securitySettings?.prevent_tab_switching ? (
                <Badge variant="outline" className="text-xs border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                  Tab Switching Prevented
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  Tab Switching Allowed
                </Badge>
              )}

              {securitySettings?.allow_review ? (
                <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                  <Eye className="h-3 w-3 mr-1" />
                  Review Allowed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <Eye className="h-3 w-3 mr-1" />
                  Review Not Allowed
                </Badge>
              )}
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
              className="!p-0 h-auto text-muted-foreground hover:text-foreground"
              onClick={() => copyEmailToClipboard(exam.exam_instance_id.created_by?.email)}
            >
              {exam.exam_instance_id.created_by?.email}
              <Copy className="h-3 w-3 mr-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}