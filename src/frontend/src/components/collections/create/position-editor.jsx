import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, MoveVertical } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CardTitle } from "@/components/ui/card"

export function PositionEditor({
  questionId,
  currentPosition,
  index = 0,
  onPositionChange,
  allPositions = [],
  disabled = false
}) {
  const [showPositionEditor, setShowPositionEditor] = useState(false)
  const [positionInput, setPositionInput] = useState('')
  const [positionError, setPositionError] = useState('')
  
  const displayPosition = (currentPosition !== undefined ? currentPosition : index) + 1
  
  useEffect(() => {
    if (showPositionEditor) {
      setPositionInput(displayPosition.toString());
    }
  }, [currentPosition, index, showPositionEditor, displayPosition]);
  
  const handleOpenPositionEditor = () => {
    if (disabled) return;
    setPositionInput(displayPosition.toString());
    setShowPositionEditor(true);
  };

  const handlePopoverOpenChange = (open) => {
    if (disabled) return;
    setShowPositionEditor(open);
  };
  
  const handlePositionChange = () => {
    const inputPosition = parseInt(positionInput, 10);
    const newPosition = inputPosition - 1;
    
    if (isNaN(inputPosition) || inputPosition < 1) {
      setPositionError('Position must be a positive number');
      return;
    }
    
    setPositionError('');
    setShowPositionEditor(false);
    
    if (newPosition !== currentPosition) {
      onPositionChange(questionId, newPosition, allPositions);
    }
  };
  //event listener of enter to handle position change
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && showPositionEditor) {
        e.preventDefault();
        handlePositionChange();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPositionEditor, positionInput, currentPosition, questionId, onPositionChange, allPositions]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={showPositionEditor} onOpenChange={handlePopoverOpenChange}>
            <PopoverTrigger asChild>
              <div 
                className={`flex items-center ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`} 
                onClick={handleOpenPositionEditor} 
                data-testid="position-editor-trigger"
              >
                <MoveVertical className="h-4 w-4 mr-1 text-muted-foreground" />
                <CardTitle className="text-base flex items-center">
                  Question {displayPosition}
                </CardTitle>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-2">
                <h4 className="font-medium">Reorder Question</h4>
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="question-position">Position (enter any positive number)</Label>
                  <div className="flex space-x-2 items-center">
                    <Input 
                      id="question-position"
                      type="number"
                      min="1"
                      value={positionInput}
                      onChange={(e) => {
                        setPositionInput(e.target.value);
                        setPositionError('');
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handlePositionChange} size="sm">Set</Button>
                  </div>
                  {positionError && (
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" /> 
                      {positionError}
                    </p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent>
          <p>{disabled ? "Question reordering is disabled" : "Click to change question order"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
