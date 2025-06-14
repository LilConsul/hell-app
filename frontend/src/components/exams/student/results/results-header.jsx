import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle, 
  XCircle, 
  Target,
  Timer,
  Calendar,
  ArrowLeft,
  Trophy
} from "lucide-react";
import { StatusBadge } from "@/components/exams/status-badge";
import { useExamStatus } from "@/hooks/use-student-exam-status";

export function ResultsHeader({ 
  attemptData, 
  passingScore, 
  allAttempts = [],
  onAttemptChange,
  examId
}) {
  const navigate = useNavigate();
  const { 
    getAttemptStatusConfig,
    getPassFailConfig,
    formatDateTime,
    calculateDuration
  } = useExamStatus();

  const statusConfig = getAttemptStatusConfig(attemptData.status);
  const passFailConfig = attemptData.pass_fail ? getPassFailConfig(attemptData.pass_fail) : null;
  const duration = calculateDuration(attemptData.started_at, attemptData.submitted_at);
  
  const totalQuestions = attemptData.responses?.length || 0;
  const correctAnswers = attemptData.responses?.filter(r => r.score > 0).length || 0;
  const answeredQuestions = attemptData.responses?.filter(r => 
    r.text_response !== null || (r.selected_option_ids && r.selected_option_ids.length > 0)
  ).length || 0;

  const sortedAttempts = [...allAttempts].sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  const currentIndex = sortedAttempts.findIndex(a => a.id === attemptData.id);
  const attemptNumber = allAttempts.length - currentIndex;

  const getAttemptNumber = (attempt) => {
    const chronologicalIndex = sortedAttempts.findIndex(a => a.id === attempt.id);
    return allAttempts.length - chronologicalIndex;
  };

  const handleBackToExamDetails = () => {
    navigate(`/exams/${examId}`);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToExamDetails}
            className="gap-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Exam
          </Button>
          <Separator orientation="vertical" className="h-6 flex-shrink-0" />
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Trophy className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <CardTitle className="text-xl flex-1 min-w-0">
              {allAttempts.length > 1 ? (
                <Select value={attemptData.id} onValueChange={onAttemptChange}>
                  <SelectTrigger className="w-full h-auto p-0 border-none bg-transparent shadow-none focus:ring-0 text-xl font-semibold hover:bg-muted/50 rounded-md px-2 py-1 cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>Attempt {attemptNumber}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge 
                          config={statusConfig}
                          showIcon={false}
                          showBadge={true}
                          size="xs"
                        />
                        {passFailConfig && (
                          <StatusBadge 
                            config={passFailConfig}
                            showIcon={false}
                            showBadge={true}
                            size="xs"
                          />
                        )}
                        {attemptData.grade !== null && attemptData.grade !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Score: {Math.round(attemptData.grade * 100) / 100}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {sortedAttempts.map((attempt) => {
                      const attemptNum = getAttemptNumber(attempt);
                      const statusConf = getAttemptStatusConfig(attempt.status);
                      const passFailConf = attempt.pass_fail ? getPassFailConfig(attempt.pass_fail) : null;
                      
                      return (
                        <SelectItem
                          key={attempt.id}
                          value={attempt.id}
                          className="flex w-full justify-between items-center pr-8"
                        >
                          <span className="font-semibold text-base">Attempt {attemptNum}</span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <StatusBadge 
                              config={statusConf}
                              showIcon={false}
                              showBadge={true}
                              size="xs"
                            />
                            {passFailConf && (
                              <StatusBadge 
                                config={passFailConf}
                                showIcon={false}
                                showBadge={true}
                                size="xs"
                              />
                            )}
                            {attempt.grade !== null && attempt.grade !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                Score: {Math.round(attempt.grade * 100) / 100}%
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <span>Attempt {attemptNumber}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge 
                      config={statusConfig}
                      showIcon={false}
                      showBadge={true}
                      size="xs"
                    />
                    {passFailConfig && (
                      <StatusBadge 
                        config={passFailConfig}
                        showIcon={false}
                        showBadge={true}
                        size="xs"
                      />
                    )}
                    {attemptData.grade !== null && attemptData.grade !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        Score: {Math.round(attemptData.grade * 100) / 100}%
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Questions</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {correctAnswers}/{totalQuestions}
            </div>
            <div className="text-xs text-muted-foreground">
              Correct
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Answered</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {answeredQuestions}/{totalQuestions}
            </div>
            <div className="text-xs text-muted-foreground">
              Questions
            </div>
          </div>

          {duration && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Duration</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {duration}
              </div>
              <div className="text-xs text-muted-foreground">
                Time Taken
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Passing</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {passingScore}%
            </div>
            <div className="text-xs text-muted-foreground">
              Required
            </div>
          </div>
        </div>

        <div className="bg-border/20 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Started</div>
              <div className="font-medium">{formatDateTime(attemptData.started_at)}</div>
            </div>
            
            {attemptData.submitted_at && (
              <div>
                <div className="text-muted-foreground mb-1">Submitted</div>
                <div className="font-medium">{formatDateTime(attemptData.submitted_at)}</div>
              </div>
            )}
          </div>
        </div>

        {attemptData.grade !== null && attemptData.grade !== undefined && (
          <div className={`rounded-lg p-4 ${
            attemptData.pass_fail === 'pass' 
              ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
          }`}>
            <div className={`flex items-center gap-2 ${
              attemptData.pass_fail === 'pass' 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {attemptData.pass_fail === 'pass' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-medium">
                {attemptData.pass_fail === 'pass' ? 'Passed' : 'Failed'}
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              attemptData.pass_fail === 'pass' 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              {attemptData.pass_fail === 'pass' 
                ? `Congratulations! You scored ${Math.round(attemptData.grade * 100) / 100}%, which meets the passing requirement of ${passingScore}%.`
                : `You scored ${Math.round(attemptData.grade * 100) / 100}%, which is below the passing requirement of ${passingScore}%.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}