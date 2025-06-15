import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Save, Send, Maximize, Minimize} from "lucide-react";

function PageHeader({
  examData,
  totalQuestions,
  answeredCount,
  flaggedQuestions,
  currentQuestionIndex,
  onSaveAnswers,
  onSubmitExam
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const examTimer = useRef(null);
  const autoSaveInterval = useRef(null);

  // Initialize timer when examData is available
  useEffect(() => {
    if (examData?.exam_instance_id?.end_date) {
      const endTime = new Date(examData.exam_instance_id.end_date);
      const now = new Date();
      const timeLeftMs = endTime - now;
      setTimeLeft(Math.max(0, Math.floor(timeLeftMs / 1000)));
    }
  }, [examData]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0) {
      examTimer.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(examTimer.current);
    }

    return () => clearInterval(examTimer.current);
  }, [timeLeft]);

  // Auto-save interval
  useEffect(() => {
    if (examData && answeredCount > 0) {
      autoSaveInterval.current = setInterval(() => {
        handleSaveAnswers();
      }, 60000); // Auto-save every minute
    }

    return () => clearInterval(autoSaveInterval.current);
  }, [examData, answeredCount]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleTimeUp = async () => {
    try {
      await handleSaveAnswers();
      await onSubmitExam(true); // Pass autoSubmit flag
    } catch (err) {
      console.error('Error handling time up:', err);
    }
  };

  const handleSaveAnswers = async () => {
    setSaving(true);
    try {
      await onSaveAnswers();
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving answers:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitExam = async () => {
    try {
      await handleSaveAnswers(); // Save before submit
      await onSubmitExam(false);
    } catch (err) {
      console.error('Error submitting exam:', err);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } else {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {/* Mobile/Compact Layout for smaller screens or high zoom */}
        <div className="block xl:hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold truncate">{examData?.exam_instance_id.title}</h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                <span>Q{currentQuestionIndex + 1}/{totalQuestions}</span>
                <span>•</span>
                <span>{answeredCount} done</span>
                {flaggedQuestions.size > 0 && (
                  <>
                    <span>•</span>
                    <span>{flaggedQuestions.size} flagged</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 ml-2">
              <div className="flex items-center gap-1 text-sm sm:text-lg font-mono">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className={timeLeft < 300 ? 'text-red-500' : ''}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAnswers}
                disabled={saving}
                className="gap-1 text-xs sm:text-sm"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button
                onClick={handleSubmitExam}
                size="sm"
                className="bg-green-600 hover:bg-green-700 gap-1 text-xs sm:text-sm"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                Submit
              </Button>
            </div>

            <div className="flex items-center gap-1">
              {saving && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Save className="h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </div>
              )}
              {lastSaved && !saving && (
                <div className="text-xs text-green-600 hidden sm:block">
                  Auto Saved {lastSaved.toLocaleTimeString()}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-3 w-3 sm:h-4 sm:w-4" /> : <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout for larger screens and normal zoom */}
        <div className="hidden xl:block">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-4">
              <h1 className="text-xl font-bold truncate">{examData?.exam_instance_id.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <span>•</span>
                <span>{answeredCount} answered</span>
                {flaggedQuestions.size > 0 && (
                  <>
                    <span>•</span>
                    <span>{flaggedQuestions.size} flagged</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveAnswers}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Progress
                </Button>
                <Button
                  onClick={handleSubmitExam}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Send className="h-4 w-4" />
                  Submit Exam
                </Button>
              </div>

              <div className="flex items-center gap-2 text-lg font-mono">
                <Clock className="h-5 w-5" />
                <span className={timeLeft < 300 ? 'text-red-500' : ''}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              {saving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Save className="h-4 w-4 animate-spin" />
                  Saving...
                </div>
              )}
              {lastSaved && !saving && (
                <div className="text-sm text-green-600">
                  Auto Saved {lastSaved.toLocaleTimeString()}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-2 sm:mt-4">
          <Progress value={progress} className="h-1.5 sm:h-2" />
        </div>
      </div>
    </div>
  );
}

export default PageHeader;