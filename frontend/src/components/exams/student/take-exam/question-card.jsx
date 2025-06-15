import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/exams/status-badge";
import { Flag, Save, CheckCircle } from "lucide-react";
import { useExamStatus } from "@/hooks/use-student-exam-status";

function QuestionCard({ 
  question, 
  index, 
  answer, 
  isFlagged, 
  isUnsaved,
  onAnswerChange, 
  onToggleFlag,
  onSaveQuestion
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const { getStatusConfig } = useExamStatus();


  const getQuestionStatus = () => {
    const isAnswered = answer !== '' && answer !== null && answer !== undefined && 
                      (Array.isArray(answer) ? answer.length > 0 : true);
    return isAnswered ? 'answered' : 'not_answered';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveQuestion(question.id);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const questionStatus = getQuestionStatus();
  const statusConfig = getStatusConfig(questionStatus);

  let cardClasses = "mb-6";
  if (isUnsaved) {
    cardClasses += " border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/50";
  }

  return (
    <Card className={cardClasses}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Question {index + 1}
            {isFlagged && <Flag className="h-4 w-4 text-yellow-500" />}
            {isUnsaved && <span className="text-xs text-amber-600 font-normal">Unsaved</span>}
            <StatusBadge 
              config={statusConfig} 
              size="sm" 
              showIcon={true} 
              showBadge={true} 
            />
          </CardTitle>
          <div className="flex items-center gap-2">
            {isUnsaved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : justSaved ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : justSaved ? 'Saved' : 'Save'}
              </Button>
            )}
            <Button
              variant={isFlagged ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleFlag(question.id)}
              className="gap-1"
            >
              <Flag className="h-4 w-4" />
              {isFlagged ? 'Unflag' : 'Flag'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-base leading-relaxed">{question.question_text}</p>
          {question.weight && (
            <Badge variant="secondary" className="mt-2">
              {question.weight > 1 ? `${question.weight} points` : `${question.weight} point`}
            </Badge>
          )}
        </div>

        {question.type === 'mcq' && (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option.id}`}
                  checked={Array.isArray(answer) ? answer.includes(option.id) : false}
                  onCheckedChange={(checked) => {
                    const currentAnswers = Array.isArray(answer) ? answer : [];
                    const newAnswers = checked
                      ? [...currentAnswers, option.id]
                      : currentAnswers.filter(a => a !== option.id);
                    onAnswerChange(question.id, newAnswers);
                  }}
                />
                <Label htmlFor={`${question.id}-${option.id}`} className="text-sm">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        )}

        {question.type === 'singlechoice' && (
          <RadioGroup
            value={Array.isArray(answer) ? answer[0] : answer}
            onValueChange={(value) => onAnswerChange(question.id, [value])}
          >
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} className="cursor-pointer"/>
                <Label htmlFor={`${question.id}-${option.id}`} className="text-sm cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === 'shortanswer' && (
          <Textarea
            value={answer || ''}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="min-h-[100px]"
          />
        )}
      </CardContent>
    </Card>
  );
}

export default QuestionCard;