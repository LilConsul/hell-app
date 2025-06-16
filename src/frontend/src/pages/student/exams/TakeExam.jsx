import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from "@/components/exams/student/take-exam/page-header";
import StudentExamsAPI from "./Student.api";

import { 
  ExamLoadingState, 
  ExamErrorAlert, 
  TabSwitchWarning, 
  InitialErrorAlert 
} from "@/components/exams/student/take-exam/alerts";
import QuestionCard from "@/components/exams/student/take-exam/question-card";
import QuestionNavigation from "@/components/exams/student/take-exam/question-navigation";
import { SubmitConfirmationModal, AutoSubmitModal } from "@/components/exams/student/take-exam/submit-modals";
import ExamResultsOverlay from "@/components/exams/student/take-exam/exam-results";


function TakeExam() {
  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savedAnswers, setSavedAnswers] = useState({});
  const [unsavedQuestions, setUnsavedQuestions] = useState(new Set());
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [autoSubmitState, setAutoSubmitState] = useState({
    saveProgress: 0,
    submitProgress: 0,
    currentlySaving: 0,
    totalToSave: 0,
    isSubmitting: false,
    error: null
  });
  const [results, setResults] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [lastFlaggedQuestionId, setLastFlaggedQuestionId] = useState(null);
  
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const questionRefs = useRef({});
  const autoSaveIntervalRef = useRef(null);

  const onNavigateBack = () => {
    navigate(`/exams/${examId}`);
  }

  // Auto-save every minute
  useEffect(() => {
    if (examData && unsavedQuestions.size > 0) {
      autoSaveIntervalRef.current = setInterval(async () => {
        await saveAllUnsavedQuestions();
      }, 60000); // 1 minute

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [examData, unsavedQuestions.size]);

  // Update unsaved questions when answers change
  useEffect(() => {
    const newUnsavedQuestions = new Set();
    
    Object.keys(answers).forEach(questionId => {
      const currentAnswer = answers[questionId];
      const savedAnswer = savedAnswers[questionId];
      
      // Compare current answer with saved answer
      const isModified = JSON.stringify(currentAnswer) !== JSON.stringify(savedAnswer);
      
      if (isModified) {
        newUnsavedQuestions.add(questionId);
      }
    });
    
    setUnsavedQuestions(newUnsavedQuestions);
  }, [answers, savedAnswers]);

  const saveAllUnsavedQuestions = async (isAutoSubmit = false) => {
    if (unsavedQuestions.size === 0) return;

    const questionsToSave = Array.from(unsavedQuestions);
    const savedQuestionIds = [];

    if (isAutoSubmit) {
      setAutoSubmitState(prev => ({
        ...prev,
        totalToSave: questionsToSave.length,
        saveProgress: 0
      }));
    }

    for (let i = 0; i < questionsToSave.length; i++) {
      const questionId = questionsToSave[i];
      
      if (isAutoSubmit) {
        setAutoSubmitState(prev => ({
          ...prev,
          currentlySaving: i + 1
        }));
      }

      const success = await saveQuestionAnswer(questionId);
      if (success) {
        savedQuestionIds.push(questionId);
      }

      if (isAutoSubmit) {
        const progress = Math.min(90, ((i + 1) / questionsToSave.length) * 90);
        setAutoSubmitState(prev => ({
          ...prev,
          saveProgress: progress
        }));
      }
    }

    // Update saved answers for successfully saved questions
    if (savedQuestionIds.length > 0) {
      setSavedAnswers(prev => {
        const updated = { ...prev };
        savedQuestionIds.forEach(questionId => {
          updated[questionId] = answers[questionId];
        });
        return updated;
      });
    }

    if (isAutoSubmit) {
      setAutoSubmitState(prev => ({
        ...prev,
        saveProgress: 100
      }));
    }
  };

  const handleSubmitExam = async (isAutoSubmit = false) => {
    try {
      setError(null);
      
      if (isAutoSubmit) {
        setAutoSubmitState(prev => ({
          ...prev,
          isSubmitting: true,
          submitProgress: 0
        }));
      } else {
        setIsSubmitting(true);
        setSubmitProgress(0);
      }

      // Simulate submit progress
      const progressInterval = setInterval(() => {
        if (isAutoSubmit) {
          setAutoSubmitState(prev => ({
            ...prev,
            submitProgress: Math.min(90, prev.submitProgress + 10)
          }));
        } else {
          setSubmitProgress(prev => Math.min(90, prev + 10));
        }
      }, 200);

      const response = await StudentExamsAPI.submitExam(examId);
      
      clearInterval(progressInterval);
      
      if (isAutoSubmit) {
        setAutoSubmitState(prev => ({
          ...prev,
          submitProgress: 100
        }));
      } else {
        setSubmitProgress(100);
      }

      // Small delay to show completion
      setTimeout(() => {
        setResults(response.data);
        setShowResults(true);
        setShowSubmitModal(false);
        setShowAutoSubmitModal(false);
        setIsSubmitting(false);
        setAutoSubmitState({
          saveProgress: 0,
          submitProgress: 0,
          currentlySaving: 0,
          totalToSave: 0,
          isSubmitting: false,
          error: null
        });
      }, 1000);

    } catch (err) {
      console.error('Error submitting exam:', err);
      const errorMessage = err.message || 'Failed to submit exam';
      
      if (isAutoSubmit) {
        setAutoSubmitState(prev => ({
          ...prev,
          error: errorMessage,
          isSubmitting: false
        }));
      } else {
        setError('Failed to submit exam: ' + errorMessage);
        setIsSubmitting(false);
        setSubmitProgress(0);
      }
    }
  };

  useEffect(() => {
    const initializeExam = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const examResponse = await StudentExamsAPI.getStudentExam(examId);
        const studentExam = examResponse.data;
        
        setExamData(studentExam);
        
        if (studentExam.current_status === 'in_progress') {
          const reloadResponse = await StudentExamsAPI.reloadExam(examId);
          const reloadedQuestions = reloadResponse.data;
          
          setQuestions(reloadedQuestions);
          
          const answerMap = {};
          const savedAnswerMap = {};
          const flaggedSet = new Set();
          
          reloadedQuestions.forEach(question => {
            let answer = null;
            
            if (question.type === 'shortanswer' && question.user_text_response) {
              answer = question.user_text_response;
            } else if ((question.type === 'mcq' || question.type === 'singlechoice') && question.user_selected_options?.length > 0) {
              answer = question.user_selected_options;
            }
            
            if (answer !== null) {
              answerMap[question.id] = answer;
              savedAnswerMap[question.id] = answer; // These are already saved
            }
            
            if (question.is_flagged) {
              flaggedSet.add(question.id);
            }
          });
          
          setAnswers(answerMap);
          setSavedAnswers(savedAnswerMap);
          setFlaggedQuestions(flaggedSet);
        } else {
          const startResponse = await StudentExamsAPI.startExam(examId);
          const startedQuestions = startResponse.data;
          
          setQuestions(startedQuestions);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing exam:', err);
        
        if (err.response?.status === 403 && err.response?.data?.detail === "Exam not in progress") {
          try {
            const startResponse = await StudentExamsAPI.startExam(examId);
            const startedQuestions = startResponse.data;
            
            const examResponse = await StudentExamsAPI.getStudentExam(examId);
            const studentExam = examResponse.data;
            
            setExamData(studentExam);
            setQuestions(startedQuestions);
            
            setLoading(false);
          } catch (startErr) {
            console.error('Error starting exam:', startErr);
            setError(startErr.message || 'Failed to start exam');
            setLoading(false);
          }
        } else {
          setError(err.message || 'Failed to initialize exam');
          setLoading(false);
        }
      }
    };

    if (examId) {
      initializeExam();
    }
  }, [examId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examData?.exam_instance_id.security_settings?.prevent_tab_switching) {
        setTabSwitchCount(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examData]);

  const handleTimeUp = async () => {
    try {
      setShowAutoSubmitModal(true);
      setAutoSubmitState({
        saveProgress: 0,
        submitProgress: 0,
        currentlySaving: 0,
        totalToSave: 0,
        isSubmitting: false,
        error: null
      });
      
      await saveAllUnsavedQuestions(true);
      await handleSubmitExam(true);
    } catch (err) {
      console.error('Error handling time up:', err);
      setAutoSubmitState(prev => ({
        ...prev,
        error: err.message || 'Failed to auto-submit exam'
      }));
    }
  };

  const saveQuestionAnswer = async (questionId) => {
    const answer = answers[questionId];
    if (!answer) return false;

    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return false;

      let answerData = { question_id: questionId };
      
      if (question.type === 'shortanswer') {
        answerData.answer = answer;
      } else if (question.type === 'mcq') {
        answerData.option_ids = Array.isArray(answer) ? answer : [answer];
      } else if (question.type === 'singlechoice') {
        answerData.option_ids = Array.isArray(answer) ? answer : [answer];
      }
      
      await StudentExamsAPI.saveAnswer(examId, answerData);
      return true;
    } catch (err) {
      console.error('Error saving question answer:', err);
      return false;
    }
  };

  const saveAnswers = async () => {
    await saveAllUnsavedQuestions();
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSaveQuestion = async (questionId) => {
    const success = await saveQuestionAnswer(questionId);
    if (success) {
      setSavedAnswers(prev => ({
        ...prev,
        [questionId]: answers[questionId]
      }));
    }
    return success;
  };

  const toggleFlag = async (questionId) => {
    try {
      await StudentExamsAPI.toggleFlagQuestion(examId, questionId);
      
      setFlaggedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(questionId)) {
          newSet.delete(questionId);
        } else {
          newSet.add(questionId);
        }
        return newSet;
      });
      
      if (lastFlaggedQuestionId !== questionId) {
        const currentQuestionIdx = questions.findIndex(q => q.id === questionId);
        const nextIndex = currentQuestionIdx + 1;
        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex);
          scrollToQuestion(nextIndex);
        }
        setLastFlaggedQuestionId(questionId);
      }

    } catch (err) {
      console.error('Error toggling flag:', err);
      setError('Failed to toggle flag: ' + (err.message || 'Unknown error'));
    }
  };

  const scrollToQuestion = (index) => {
    const questionElement = questionRefs.current[index];
    if (questionElement) {
      const headerHeight = 128;
      const elementTop = questionElement.offsetTop - headerHeight;
      window.scrollTo({ top: elementTop, behavior: 'smooth' });
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    scrollToQuestion(index);
  };

  const handleSubmitRequest = () => {
    setShowSubmitModal(true);
  };

  const handleSubmitConfirm = async () => {
    try {
      // Hide the confirmation modal and show the auto-submit modal
      setShowSubmitModal(false);
      setShowAutoSubmitModal(true);
      
      // Reset auto-submit state
      setAutoSubmitState({
        saveProgress: 0,
        submitProgress: 0,
        currentlySaving: 0,
        totalToSave: 0,
        isSubmitting: false,
        error: null
      });
      
      // Perform the same save and submit flow as time up
      await saveAllUnsavedQuestions(true);
      await handleSubmitExam(true);
    } catch (err) {
      console.error('Error handling submit confirmation:', err);
      setAutoSubmitState(prev => ({
        ...prev,
        error: err.message || 'Failed to submit exam'
      }));
    }
  };

  const handleSubmitCancel = () => {
    setShowSubmitModal(false);
  };

  if (loading) {
    return <ExamLoadingState />;
  }

  if (error && !examData) {
    return <InitialErrorAlert error={error} />;
  }

  const answeredCount = Object.keys(answers).filter(key => {
    const answer = answers[key];
    return answer !== '' && answer !== null && answer !== undefined && 
           (Array.isArray(answer) ? answer.length > 0 : true);
  }).length;
  const totalQuestions = questions?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        examData={examData}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        flaggedQuestions={flaggedQuestions}
        onSaveAnswers={saveAnswers}
        onSubmitExam={handleSubmitRequest}
        onTimeUp={handleTimeUp}
      />

      <ExamErrorAlert error={error} />
      
      <TabSwitchWarning 
        tabSwitchCount={tabSwitchCount}
        securitySettings={examData?.exam_instance_id.security_settings}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <QuestionNavigation
              questions={questions}
              answers={answers}
              flaggedQuestions={flaggedQuestions}
              currentQuestionIndex={currentQuestionIndex}
              unsavedQuestions={unsavedQuestions}
              onGoToQuestion={goToQuestion}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-6">
              {questions?.map((question, index) => (
                <div key={question.id} ref={el => questionRefs.current[index] = el} onClick={() => goToQuestion(index)}>
                  <QuestionCard
                    question={question}
                    index={index}
                    answer={answers[question.id] || ''}
                    isFlagged={flaggedQuestions.has(question.id)}
                    isUnsaved={unsavedQuestions.has(question.id)}
                    onAnswerChange={handleAnswerChange}
                    onToggleFlag={toggleFlag}
                    onSaveQuestion={handleSaveQuestion}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SubmitConfirmationModal
        isOpen={showSubmitModal}
        onConfirm={handleSubmitConfirm}
        onCancel={handleSubmitCancel}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        isSubmitting={isSubmitting}
        submitProgress={submitProgress}
      />

      <AutoSubmitModal
        isOpen={showAutoSubmitModal}
        saveProgress={autoSubmitState.saveProgress}
        submitProgress={autoSubmitState.submitProgress}
        currentlySaving={autoSubmitState.currentlySaving}
        totalToSave={autoSubmitState.totalToSave}
        isSubmitting={autoSubmitState.isSubmitting}
        error={autoSubmitState.error}
        onGoToExamDetails={onNavigateBack}
      />

      {showResults && results && (
        <ExamResultsOverlay
          results={results}
          onNavigateBack={onNavigateBack}
        />
      )}
    </div>
  );
}

export default TakeExam;