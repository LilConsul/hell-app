import { useMemo } from 'react';

export const useExamStatus = () => {
  const getExamStatus = useMemo(() => (exam) => {
    const now = new Date();
    const startDate = new Date(exam.exam_instance_id.start_date);
    const endDate = new Date(exam.exam_instance_id.end_date);
    const currentStatus = exam.current_status;
    
    if (currentStatus === "submitted") {
      if (now > endDate || exam.attempts_count >= exam.exam_instance_id.max_attempts) {
        return "completed";
      }
      return "submitted";
    }
    
    if (currentStatus === "in_progress") {
      return "in_progress";
    }
    
    if (now > endDate && currentStatus !== "submitted") {
      return "overdue";
    }
    
    if (now >= startDate && now <= endDate) {
      return "active";
    }
    
    return "not_started";
  }, []);

  const getTimeStatus = useMemo(() => (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "active";
  }, []);

  const getStatusConfig = useMemo(() => (status) => {
    // Color schemes for consistent styling
    const colorSchemes = {
      gray: "border-gray-300 text-gray-800 bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900/50",
      blue: "border-blue-300 text-blue-800 bg-blue-50 dark:border-blue-700 dark:text-blue-200 dark:bg-blue-900/50",
      amber: "border-amber-300 text-amber-800 bg-amber-50 dark:border-amber-700 dark:text-amber-200 dark:bg-amber-900/50",
      green: "border-green-300 text-green-800 bg-green-50 dark:border-green-700 dark:text-green-200 dark:bg-green-900/50",
      red: "border-red-300 text-red-800 bg-red-50 dark:border-red-700 dark:text-red-200 dark:bg-red-900/50",
      purple: "border-purple-300 text-purple-800 bg-purple-50 dark:border-purple-700 dark:text-purple-200 dark:bg-purple-900/50"
    };

    // Unified configuration object
    const allConfigs = {
      // Exam statuses
      not_started: {
        badge: { variant: "outline", text: "Not Started", className: colorSchemes.gray },
        icon: "PlayCircle"
      },
      in_progress: {
        badge: { variant: "outline", text: "In Progress", className: colorSchemes.blue },
        icon: "Timer"
      },
      submitted: {
        badge: { variant: "outline", text: "Submitted", className: colorSchemes.amber },
        icon: "Clock"
      },
      completed: {
        badge: { variant: "outline", text: "Completed", className: colorSchemes.green },
        icon: "CheckCircle"
      },
      overdue: {
        badge: { variant: "outline", text: "Overdue", className: colorSchemes.red },
        icon: "AlertTriangle"
      },
      ended: {
        badge: { variant: "outline", text: "Ended", className: colorSchemes.red },
        icon: "Clock"
      },
      active: {
        badge: { variant: "outline", text: "Active", className: colorSchemes.green },
        icon: "Clock"
      },
      upcoming: {
        badge: { variant: "outline", text: "Starts Soon", className: colorSchemes.blue },
        icon: "Calendar"
      },
      
      // Pass/Fail statuses
      pass: {
        badge: { variant: "outline", text: "Pass", className: colorSchemes.green },
        icon: "CheckCircle"
      },
      fail: {
        badge: { variant: "outline", text: "Fail", className: colorSchemes.red },
        icon: "XCircle"
      },
      
      // Security features - positive states
      questions_shuffled: {
        badge: { variant: "outline", text: "Questions Shuffled", className: colorSchemes.purple },
        icon: "Shuffle"
      },
      tab_switching_prevented: {
        badge: { variant: "outline", text: "Tab Switching Prevented", className: colorSchemes.red },
        icon: "Lock"
      },
      review_allowed: {
        badge: { variant: "outline", text: "Review Allowed", className: colorSchemes.green },
        icon: "Eye"
      },
      
      // Security features - neutral/disabled states
      questions_not_shuffled: {
        badge: { variant: "outline", text: "Questions Not Shuffled", className: colorSchemes.gray },
        icon: "List"
      },
      tab_switching_allowed: {
        badge: { variant: "outline", text: "Tab Switching Allowed", className: colorSchemes.gray },
        icon: "Unlock"
      },
      review_not_allowed: {
        badge: { variant: "outline", text: "Review Not Allowed", className: colorSchemes.gray },
        icon: "EyeOff"
      },

      // Question statuses
      correct_answer: {
        badge: { variant: "outline", text: "Correct", className: colorSchemes.green },
        icon: "CheckCircle"
      },
      incorrect_answer: {
        badge: { variant: "outline", text: "Incorrect", className: colorSchemes.red },
        icon: "XCircle"
      },
      unanswered: {
        badge: { variant: "outline", text: "Unanswered", className: colorSchemes.gray },
        icon: "AlertCircle"
      },
      flagged: {
        badge: { variant: "outline", text: "Flagged", className: colorSchemes.amber },
        icon: "Flag"
      }
    };

    return allConfigs[status] || allConfigs.not_started;
  }, []);

  // Keep these as aliases for backward compatibility and semantic clarity
  const getSecurityFeatureStatus = useMemo(() => (securitySettings) => {
    if (!securitySettings) return [];
    
    const features = [];
    
    features.push(securitySettings.shuffle_questions ? 'questions_shuffled' : 'questions_not_shuffled');
    features.push(securitySettings.prevent_tab_switching ? 'tab_switching_prevented' : 'tab_switching_allowed');
    features.push(securitySettings.allow_review ? 'review_allowed' : 'review_not_allowed');
    
    return features;
  }, []);

  const getAttemptStatusConfig = useMemo(() => (status) => {
    return getStatusConfig(status);
  }, [getStatusConfig]);

  const getPassFailConfig = useMemo(() => (passFail) => {
    return getStatusConfig(passFail);
  }, [getStatusConfig]);

  const formatDateTime = useMemo(() => (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const formatDateTimeDetailed = useMemo(() => (dateString) => {
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
  }, []);

  const calculateDuration = useMemo(() => (startTime, endTime) => {
    if (!startTime || !endTime) return null;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    
    const minutes = Math.floor(durationMs / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, []);

  const calculateTimeRemaining = useMemo(() => (startTime, examEndDate) => {
    if (!startTime || !examEndDate) return null;
    
    const now = new Date();
    const endDate = new Date(examEndDate);
    const timeLeft = endDate - now;
    
    if (timeLeft <= 0) return "Time expired";
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }, []);

  const calculateAverage = useMemo(() => (attempts) => {
    if (!attempts || attempts.length === 0) return null;
    
    const gradesWithValues = attempts.filter(attempt => 
      attempt.grade !== null && attempt.grade !== undefined
    );
    
    if (gradesWithValues.length === 0) return null;
    
    const sum = gradesWithValues.reduce((acc, attempt) => acc + attempt.grade, 0);
    return Math.round(sum / gradesWithValues.length);
  }, []);

  const getHighestGrade = useMemo(() => (attempts) => {
    if (!attempts || attempts.length === 0) return null;
    
    const gradesWithValues = attempts.filter(attempt => 
      attempt.grade !== null && attempt.grade !== undefined
    );
    
    if (gradesWithValues.length === 0) return null;
    
    return Math.max(...gradesWithValues.map(attempt => attempt.grade));
  }, []);

  return {
    getExamStatus,
    getTimeStatus,
    getStatusConfig,
    getAttemptStatusConfig,   // Kept for backward compatibility
    getPassFailConfig,        // Kept for backward compatibility
    getSecurityFeatureStatus, // Kept for backward compatibility
    formatDateTime,
    formatDateTimeDetailed,
    calculateDuration,
    calculateTimeRemaining,
    calculateAverage,
    getHighestGrade
  };
};