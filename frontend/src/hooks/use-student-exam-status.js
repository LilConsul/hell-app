import { useMemo } from 'react';

export const useExamStatus = () => {
  const getExamStatus = useMemo(() => (exam) => {
    const now = new Date();
    const startDate = new Date(exam.exam_instance_id.start_date);
    const endDate = new Date(exam.exam_instance_id.end_date);
    const currentStatus = exam.current_status;
    
    // If current status is submitted
    if (currentStatus === "submitted") {
      // Completed: submitted AND past end date OR max attempts reached
      if (now > endDate || exam.attempts_count >= exam.exam_instance_id.max_attempts) {
        return "completed";
      }
      return "submitted";
    }
    
    // If current status is in_progress
    if (currentStatus === "in_progress") {
      return "in_progress";
    }
    
    // Overdue: past end date AND not submitted
    if (now > endDate && currentStatus !== "submitted") {
      return "overdue";
    }
    
    // Active: within start/end date AND can be started/continued
    if (now >= startDate && now <= endDate) {
      return "active";
    }
    
    // Default to not_started
    return "not_started";
  }, []);

  const getTimeStatus = useMemo(() => (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return {
        status: "upcoming",
        text: "Starts soon",
        color: "text-blue-600 dark:text-blue-400",
        icon: "Calendar"
      };
    } else if (now > end) {
      return {
        status: "overdue",
        text: "Ended",
        color: "text-red-500 dark:text-red-400",
        icon: "AlertTriangle"
      };
    } else {
      return {
        status: "active",
        text: "Active",
        color: "text-green-600 dark:text-green-400",
        icon: "Clock"
      };
    }
  }, []);

  const getStatusConfig = useMemo(() => (status) => {
    const configs = {
      not_started: {
        badge: { variant: "secondary", text: "Not Started" },
        icon: "PlayCircle",
        color: "text-gray-500 dark:text-gray-400"
      },
      in_progress: {
        badge: { variant: "default", text: "In Progress" },
        icon: "PauseCircle",
        color: "text-blue-500 dark:text-blue-400"
      },
      submitted: {
        badge: { variant: "outline", text: "Submitted" },
        icon: "Clock",
        color: "text-orange-500 dark:text-orange-400"
      },
      completed: {
        badge: { variant: "default", text: "Completed" },
        icon: "CheckCircle",
        color: "text-green-500 dark:text-green-400"
      },
      overdue: {
        badge: { variant: "destructive", text: "Overdue" },
        icon: "AlertTriangle",
        color: "text-red-500 dark:text-red-400"
      }
    };
    return configs[status] || configs.not_started;
  }, []);

  return {
    getExamStatus,
    getTimeStatus,
    getStatusConfig
  };
};
