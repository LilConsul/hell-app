import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Check,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PositionEditor } from "@/components/collections/create/position-editor"
import { ValueSelector } from "@/components/value-selector"

export function QuestionCard({
  question,
  index,
  isNew = false,
  onSave,
  onChange,
  onRemove,
  canSave = true,
  disabled = false,
  usedPositions = [],
  onPositionChange = null,
  viewOnly = false,
}) {
  const [touchedFields, setTouchedFields] = useState({
    questionText: false,
    options: {},
    correctAnswer: false,
    correctOption: false,
  })

  // Memoize question type properties
  const questionTypeInfo = useMemo(() => {
    const types = {
      mcq: { 
        label: "Multiple Choice", 
        icon: <CheckCircle2 className="h-4 w-4 mr-1" />,
        multiSelect: true
      },
      singlechoice: { 
        label: "Single Choice", 
        icon: <CircleDot className="h-4 w-4 mr-1" />,
        multiSelect: false 
      },
      shortanswer: { 
        label: "Short Answer", 
        icon: <Save className="h-4 w-4 mr-1" />,
        multiSelect: false
      }
    };
    return types[question.type] || { label: "Unknown Type", icon: null, multiSelect: false };
  }, [question.type]);
  
  // Memoize common type checks
  const isChoiceQuestion = useMemo(() => 
    question.type === "mcq" || question.type === "singlechoice", 
    [question.type]
  );

  const updateField = (field, value) => {
    if (question[field] !== value) {
      const updated = { ...question, [field]: value, saved: false };
      onChange?.(updated.id, updated);
    }
  };

  // Update options with a specific transform function for each case
  const updateOptions = (transformFn) => {
    const updatedOptions = transformFn(question.options || []);
    const optionsChanged = JSON.stringify(updatedOptions) !== JSON.stringify(question.options);
    if (optionsChanged) {
      const updated = { ...question, options: updatedOptions, saved: false };
      onChange?.(updated.id, updated);
    }
  };

  const markAsTouched = (field, optionIndex = null) => {
    if (optionIndex !== null) {
      setTouchedFields(prev => ({
        ...prev,
        options: { ...prev.options, [optionIndex]: true }
      }));
    } else {
      setTouchedFields(prev => ({ ...prev, [field]: true }));
    }
  };
  
  // Check if question has text and at least one correct option
  const isQuestionValid = useMemo(() => {
    if (!question.question_text.trim()) return false;
    
    if (isChoiceQuestion) {
      if (!question.options?.some(opt => opt.is_correct)) return false;
      if (question.options.some(opt => !opt.text.trim())) return false;
    }
    
    if (question.type === "shortanswer" && !question.correct_input_answer?.trim()) {
      return false;
    }
    
    return true;
  }, [
    question.question_text, 
    question.options, 
    question.correct_input_answer, 
    question.type, 
    isChoiceQuestion
  ]);

  const markAllFieldsAsTouched = () => {
    const optionTouchedState = {};
    if (question.options) {
      question.options.forEach((_, idx) => {
        optionTouchedState[idx] = true;
      });
    }
    
    setTouchedFields({
      questionText: true,
      options: optionTouchedState,
      correctAnswer: true,
      correctOption: true,
    });
  };

  const handleSaveClick = () => {
    if (!isQuestionValid) {
      markAllFieldsAsTouched();
      return;
    }
    onSave(question.id, question);
  };

  const handleWeightChange = (value) => {
    updateField("weight", value);
  };

  // Show validation errors only if field has been touched
  const showQuestionTextError = touchedFields.questionText && !question.question_text.trim();
  const showShortAnswerError = touchedFields.correctAnswer && 
    question.type === "shortanswer" && 
    !question.correct_input_answer?.trim();
  
  const showCorrectOptionError = touchedFields.correctOption && 
    isChoiceQuestion && 
    !question.options?.some(opt => opt.is_correct);
  
  const showOptionsWithoutTextError = isChoiceQuestion &&
    Object.entries(touchedFields.options).some(([idx, touched]) => 
      touched && !question.options[parseInt(idx)]?.text?.trim()
    );
    
  const hasValidationErrors = 
    showQuestionTextError || 
    showShortAnswerError || 
    showCorrectOptionError || 
    showOptionsWithoutTextError;

  // Unique ID for the weight selector
  const weightInputId = `weight-${question.id}`;

  // View-only mode rendering
  if (viewOnly) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {index}
              </div>
              <Badge variant="outline" className="flex items-center">
                {questionTypeInfo.icon}
                {questionTypeInfo.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.weight || 1} {(question.weight || 1) === 1 ? 'point' : 'points'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Question</h3>
            <p className="text-base">{question.question_text}</p>
          </div>
          
          {isChoiceQuestion && question.options && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Options</h3>
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <div 
                    key={optIndex} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      option.is_correct 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                        : 'bg-muted/30'
                    }`}
                  >
                    {option.is_correct && (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      option.is_correct 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-muted-foreground/30'
                    }`}>
                      {question.type === "singlechoice" ? (
                        <div className={`w-2 h-2 rounded-full ${
                          option.is_correct ? 'bg-white' : ''
                        }`} />
                      ) : (
                        option.is_correct && <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className={`flex-1 ${
                      option.is_correct ? 'font-medium text-green-700 dark:text-green-300' : ''
                    }`}>
                      {option.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {question.type === "shortanswer" && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Correct Answer</h3>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    {question.correct_input_answer}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!question.saved && !isNew ? "border-amber-300 dark:border-amber-600" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center">
          <PositionEditor
            questionId={question.id}
            currentPosition={question.position}
            index={index}
            onPositionChange={onPositionChange}
            allPositions={usedPositions}
            disabled={disabled || !canSave}
          /> 
          <Badge variant="outline" className="ml-2 flex items-center">
            {questionTypeInfo.icon}
            {questionTypeInfo.label}
          </Badge>
          {isNew && (
            <Badge className="ml-2 text-neutral-950 dark:text-neutral-50 bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
              New
            </Badge>
          )}
          {!question.saved && !isNew && (
            <Badge variant="outline" className="ml-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700">
              Unsaved
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant={question.saved ? "ghost" : "outline"}
            size="sm"
            onClick={handleSaveClick}
            disabled={disabled}
            className={hasValidationErrors ? "animate-pulse bg-red-50 dark:bg-red-900/30" : ""}
            title={
              disabled ? "Cannot save while collection is archived" :
              hasValidationErrors ? "Please fill in all required fields" : 
              !canSave ? "Save collection first to enable individual question saves" : ""
            }
          >
            {hasValidationErrors && <AlertCircle className="h-4 w-4 mr-1 text-red-500" />}
            <Save className="h-4 w-4 mr-1" />
            {question.saved ? "Saved" : (canSave ? "Save Question" : "Save Collection First")}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onRemove(question.id)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor={`question-${question.id}`}>Question Text</Label>
          <Textarea
            id={`question-${question.id}`}
            placeholder="Enter your question here..."
            value={question.question_text}
            onChange={(e) => updateField("question_text", e.target.value)}
            onBlur={() => markAsTouched('questionText')}
            className={showQuestionTextError ? "border-red-300 dark:border-red-700" : ""}
            disabled={disabled}
          />
          {showQuestionTextError && (
            <p className="text-xs text-red-500 dark:text-red-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" /> 
              Question text is required
            </p>
          )}
        </div>
        {isChoiceQuestion && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Answer Options</Label>
              <span className="text-xs text-muted-foreground">
                {questionTypeInfo.multiSelect ? "Multiple answers can be correct" : "Only one answer can be correct"}
              </span>
            </div>
            {question.options?.map((option, optIndex) => {
              const showOptionError = touchedFields.options[optIndex] && !option.text?.trim();
              return (
                <div key={optIndex} className="flex items-center space-x-2">
                  {question.type === "singlechoice" ? (
                    <RadioGroup
                      value={question.options.findIndex(o => o.is_correct) === optIndex ? optIndex.toString() : ""}
                      onValueChange={() => {
                        updateOptions(opts => 
                          opts.map((o, i) => ({ ...o, is_correct: i === optIndex }))
                        );
                        markAsTouched('correctOption');
                      }}
                      className={`flex items-center ${showCorrectOptionError ? 'outline-red-300 outline outline-1 rounded-md p-1' : ''}`}
                      disabled={disabled}
                    >
                      <RadioGroupItem 
                        value={optIndex.toString()} 
                        id={`q${question.id}-opt${optIndex}`} 
                        disabled={disabled} 
                        className={showOptionError ? 'border-red-300 dark:border-red-700' : ''}
                      />
                    </RadioGroup>
                  ) : (
                    <Checkbox
                      checked={option.is_correct}
                      onCheckedChange={() => {
                        updateOptions(opts => 
                          opts.map((o, i) => 
                            i === optIndex ? { ...o, is_correct: !o.is_correct } : o
                          )
                        );
                        markAsTouched('correctOption');
                      }}
                      disabled={disabled}
                      className={`mt-0 ${
                        showOptionError 
                          ? 'border-red-300 dark:border-red-700 outline-red-300 outline outline-1' 
                          : ''
                      }`}
                    />
                  )}
                  <Input
                    placeholder={`Option ${optIndex + 1}`}
                    value={option.text}
                    onChange={(e) => {
                      updateOptions(opts => 
                        opts.map((o, i) => 
                          i === optIndex ? { ...o, text: e.target.value } : o
                        )
                      );
                    }}
                    onBlur={() => markAsTouched('options', optIndex)}
                    className={showOptionError ? "border-red-300 dark:border-red-700" : "flex-1"}
                    disabled={disabled}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      updateOptions(opts => opts.filter((_, i) => i !== optIndex));
                      
                      // Clean up touched state for removed option
                      setTouchedFields(prev => {
                        const newOptionsTouched = { ...prev.options };
                        delete newOptionsTouched[optIndex];
                        
                        // Shift touched indices down
                        const shifted = {};
                        Object.entries(newOptionsTouched).forEach(([k, v]) => {
                          const index = parseInt(k, 10);
                          if (index > optIndex) {
                            shifted[index - 1] = v;
                          } else if (index < optIndex) {
                            shifted[index] = v;
                          }
                        });
                        
                        return {
                          ...prev,
                          options: shifted,
                        };
                      });
                    }}
                    disabled={question.options.length <= 2 || disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
            {(showCorrectOptionError || showOptionsWithoutTextError) && (
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" /> 
                {showCorrectOptionError 
                  ? "Please select at least one correct option" 
                  : "All options must have text"}
              </p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => {
                updateOptions(opts => [...(opts || []), { text: "", is_correct: false }]);
              }}
              disabled={disabled}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>
        )}
        {question.type === "shortanswer" && (
          <div className="grid gap-2">
            <Label htmlFor={`answer-${question.id}`}>Correct Answer</Label>
            <Input
              id={`answer-${question.id}`}
              placeholder="Enter the correct answer"
              value={question.correct_input_answer}
              onChange={(e) => updateField("correct_input_answer", e.target.value)}
              onBlur={() => markAsTouched('correctAnswer')}
              className={showShortAnswerError ? "border-red-300 dark:border-red-700" : ""}
              disabled={disabled}
            />
            {showShortAnswerError && (
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" /> 
                Correct answer is required
              </p>
            )}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor={weightInputId}>Question Weight</Label>
          <ValueSelector
            id={weightInputId}
            value={question.weight || 1}
            onChange={handleWeightChange}
            disabled={disabled}
            customTitle = "Custom Weight"
            unitLabel = "point"
          />
        </div>
      </CardContent>
    </Card>
  )
}
