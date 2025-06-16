import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/exams/status-badge";
import { useExamStatus } from "@/hooks/use-student-exam-status";
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  FileText, 
  Circle,
  CheckSquare,
  Square,
  AlertCircle
} from "lucide-react";

export function QuestionResult({ response, questionNumber }) {
  const { getStatusConfig } = useExamStatus();
  const question = response.question_id;
  const isCorrect = response.score > 0;
  const hasAnswer = response.text_response !== null || 
                   (response.selected_option_ids && response.selected_option_ids.length > 0);

  const getQuestionTypeDisplay = (type) => {
    switch (type) {
      case 'mcq':
        return 'Multiple Choice';
      case 'singlechoice':
        return 'Single Choice';
      case 'shortanswer':
        return 'Short Answer';
      default:
        return type;
    }
  };

  const getQuestionStatus = () => {
    if (response.is_flagged) return 'flagged';
    if (isCorrect) return 'correct_answer';
    if (hasAnswer) return 'incorrect_answer';
    return 'not_answered';
  };

  const MultipleChoiceOptions = () => {
    if (!question.options || question.options.length === 0) {
      return null;
    }

    // Sort options by their order if available
    const sortedOptions = [...question.options];
    if (response.option_order && Object.keys(response.option_order).length > 0) {
      sortedOptions.sort((a, b) => {
        const aOrder = response.option_order[a.id] ?? 999;
        const bOrder = response.option_order[b.id] ?? 999;
        return aOrder - bOrder;
      });
    }

    return (
      <div className="space-y-2">
        {sortedOptions.map((option) => {
          const isSelected = response.selected_option_ids?.includes(option.id);
          const isCorrectOption = option.is_correct;
          
          let optionStyle = "border-border bg-background";
          let iconColor = "text-muted-foreground";
          let Icon = question.type === 'mcq' ? Square : Circle;
          
          if (isSelected && isCorrectOption) {
            optionStyle = "border-green-500 bg-green-50 dark:bg-green-950";
            iconColor = "text-green-600";
            Icon = question.type === 'mcq' ? CheckSquare : CheckCircle;
          } else if (isSelected && !isCorrectOption) {
            optionStyle = "border-red-500 bg-red-50 dark:bg-red-950";
            iconColor = "text-red-600";
            Icon = question.type === 'mcq' ? CheckSquare : CheckCircle;
          } else if (!isSelected && isCorrectOption) {
            optionStyle = "border-green-300 bg-green-50 dark:bg-green-950/50";
            iconColor = "text-green-500";
          }
          
          return (
            <div
              key={option.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${optionStyle}`}
            >
              <Icon className={`h-5 w-5 mt-0.5 ${iconColor} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">
                  {option.text}
                </div>
                {isSelected && !isCorrectOption && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Your answer (incorrect)
                  </div>
                )}
                {!isSelected && isCorrectOption && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Correct answer
                  </div>
                )}
                {isSelected && isCorrectOption && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Your answer (correct)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ShortAnswerResponse = () => {
    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Your Answer:</h4>
          <div className={`p-3 rounded-lg border ${
            isCorrect 
              ? 'border-green-300 bg-green-50 dark:bg-green-950/50' 
              : hasAnswer 
                ? 'border-red-300 bg-red-50 dark:bg-red-950/50'
                : 'border-gray-300 bg-gray-50 dark:bg-gray-950/50'
          }`}>
            {hasAnswer ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {response.text_response}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No answer provided</p>
            )}
          </div>
        </div>
        
        {question.correct_answer && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Expected Answer:</h4>
            <div className="p-3 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/50">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {question.correct_answer}
              </p>
            </div>
          </div>
        )}
        
        {question.explanation && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Explanation:</h4>
            <div className="p-3 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/50">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getScoreDisplay = () => {
    const maxScore = response.question_id.weight || 1;
    return `${response.score * maxScore}/${maxScore}`;
  };

  const statusConfig = getStatusConfig(getQuestionStatus());

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Question Header */}
        <div className="bg-muted/30 px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-xs">
                  Question {questionNumber}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {getQuestionTypeDisplay(question.type)}
                </Badge>
              </div>
              <h3 className="text-base font-medium text-foreground leading-relaxed">
                {question.question_text}
              </h3>
            </div>
            
            {/* Score Display */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  {getScoreDisplay()} pts
                </div>
                <div className="text-xs text-muted-foreground">
                  Score
                </div>
              </div>
              <StatusBadge 
                  config={statusConfig}
                  size="lg"
                  showIcon={true}
                />
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          {question.type === 'mcq' || question.type === 'singlechoice' ? (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Options:</h4>
              <MultipleChoiceOptions />
            </div>
          ) : question.type === 'shortanswer' ? (
            <ShortAnswerResponse />
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Unsupported question type: {question.type}
              </p>
            </div>
          )}

          {/* General explanation for all question types */}
          {question.explanation && (question.type === 'mcq' || question.type === 'singlechoice') && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-foreground mb-2">Explanation:</h4>
              <div className="p-3 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/50">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {question.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
