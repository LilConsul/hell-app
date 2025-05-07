import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Save, CheckCircle2, CircleDot } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export function QuestionCard({
  question,
  index,
  isNew = false,
  onSave,
  onRemove,
  onUpdateText,
  onUpdateOption,
  onUpdateCorrectOption,
  onAddOption,
  onRemoveOption,
  onUpdateWeight,
  onUpdateShortAnswer,
  canSave = true,
}) {
  // Track field touches to show validation only after interaction
  const [touchedFields, setTouchedFields] = useState({
    questionText: false,
    options: {},
    correctAnswer: false,
    correctOption: false
  })
  
  const markAsTouched = (field, optionIndex = null) => {
    if (optionIndex !== null) {
      setTouchedFields(prev => ({
        ...prev,
        options: { ...prev.options, [optionIndex]: true }
      }))
    } else {
      setTouchedFields(prev => ({ ...prev, [field]: true }))
    }
  }
  
  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case "mcq":
        return "Multiple Choice"
      case "singlechoice":
        return "Single Choice"
      case "shortanswer":
        return "Short Answer"
      default:
        return "Unknown Type"
    }
  }

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case "mcq":
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      case "singlechoice":
        return <CircleDot className="h-4 w-4 mr-1" />
      case "shortanswer":
        return <Save className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  // Check if question has text and at least one correct option
  const isQuestionValid = () => {
    if (!question.question_text.trim()) return false;
    
    if (question.type === "mcq" || question.type === "singlechoice") {
      if (!question.options.some(opt => opt.is_correct)) return false;
      // Has text check
      if (question.options.some(opt => !opt.text.trim())) return false;
    }
    
    if (question.type === "shortanswer" && !question.correct_input_answer.trim()) {
      return false;
    }
    
    return true;
  }

  const markAllFieldsAsTouched = () => {
    const optionTouchedState = {};
    if (question.options) {
      question.options.forEach((_, index) => {
        optionTouchedState[index] = true;
      });
    }
    
    setTouchedFields({
      questionText: true,
      options: optionTouchedState,
      correctAnswer: true,
      correctOption: true
    });
  }

  const handleSaveClick = () => {
    if (!isQuestionValid()) {
      markAllFieldsAsTouched();
      return;
    }
    onSave(question.id);
  };

  // Show validation errors only if field has been touched or user attempted to save
  const showQuestionTextError = touchedFields.questionText && !question.question_text.trim();
  const showCorrectOptionError = touchedFields.correctOption && 
    (question.type === "mcq" || question.type === "singlechoice") && 
    !question.options.some(opt => opt.is_correct);
  const showShortAnswerError = touchedFields.correctAnswer && 
    question.type === "shortanswer" && 
    !question.correct_input_answer.trim();
  
  return (
    <Card className={!question.saved && !isNew ? "border-amber-300 dark:border-amber-600" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center">
          <CardTitle className="text-base">Question {index + 1}</CardTitle>
          <Badge variant="outline" className="ml-2 flex items-center">
            {getQuestionTypeIcon(question.type)}
            {getQuestionTypeLabel(question.type)}
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
            disabled={question.saved || !canSave}
            title={
              !canSave 
                ? "Save collection first to enable individual question saves" 
                : ""
            }
          >
            <Save className="h-4 w-4 mr-1" />
            {question.saved ? "Saved" : (canSave ? "Save Question" : "Save Collection First")}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onRemove(question.id)}>
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
            onChange={(e) => onUpdateText(question.id, e.target.value)}
            onBlur={() => markAsTouched('questionText')}
            className={showQuestionTextError ? "border-red-300 dark:border-red-700" : ""}
          />
          {showQuestionTextError && (
            <p className="text-xs text-red-500 dark:text-red-400">Question text is required</p>
          )}
        </div>
        {(question.type === "mcq" || question.type === "singlechoice") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Answer Options</Label>
              <span className="text-xs text-muted-foreground">
                {question.type === "mcq" ? "Multiple answers can be correct" : "Only one answer can be correct"}
              </span>
            </div>
            {question.options.map((option, optIndex) => (
              <div key={optIndex} className="flex items-center space-x-2">
                {question.type === "singlechoice" ? (
                  <RadioGroup
                    value={question.options.findIndex(o => o.is_correct) === optIndex ? optIndex.toString() : ""}
                    onValueChange={() => {
                      onUpdateCorrectOption(question.id, optIndex)
                      markAsTouched('correctOption')
                    }}
                    className="flex items-center"
                  >
                    <RadioGroupItem value={optIndex.toString()} id={`q${question.id}-opt${optIndex}`} />
                  </RadioGroup>
                ) : (
                  <div className="flex items-center h-10 px-2">
                    <input
                      type="checkbox"
                      id={`q${question.id}-opt${optIndex}-checkbox`}
                      checked={option.is_correct}
                      onChange={() => {
                        onUpdateCorrectOption(question.id, optIndex)
                        markAsTouched('correctOption')
                      }}
                      className="h-4 w-4"
                    />
                  </div>
                )}
                <Input
                  placeholder={`Option ${optIndex + 1}`}
                  value={option.text}
                  onChange={(e) => onUpdateOption(question.id, optIndex, e.target.value)}
                  onBlur={() => markAsTouched('options', optIndex)}
                  className={`flex-1 ${touchedFields.options[optIndex] && !option.text.trim() ? "border-red-300 dark:border-red-700" : ""}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemoveOption(question.id, optIndex)}
                  disabled={question.options.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {showCorrectOptionError && (
              <p className="text-xs text-red-500 dark:text-red-400">
                {question.type === "singlechoice" ? "Please select a correct answer" : "Please select at least one correct answer"}
              </p>
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => onAddOption(question.id)}>
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
              onChange={(e) => onUpdateShortAnswer(question.id, e.target.value)}
              onBlur={() => markAsTouched('correctAnswer')}
              className={showShortAnswerError ? "border-red-300 dark:border-red-700" : ""}
            />
            {showShortAnswerError && (
              <p className="text-xs text-red-500 dark:text-red-400">Correct answer is required</p>
            )}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor={`weight-${question.id}`}>Question Weight</Label>
          <Select
            value={question.weight.toString()}
            onValueChange={(value) => onUpdateWeight(question.id, value)}
          >
            <SelectTrigger id={`weight-${question.id}`}>
              <SelectValue placeholder="Select weight" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 point</SelectItem>
              <SelectItem value="2">2 points</SelectItem>
              <SelectItem value="3">3 points</SelectItem>
              <SelectItem value="4">4 points</SelectItem>
              <SelectItem value="5">5 points</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
