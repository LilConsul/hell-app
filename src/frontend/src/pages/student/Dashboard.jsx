import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import {
  CalendarIcon,
  Award,
  Clock,
  ArrowRight,
  Loader2,
  Eye,
} from "lucide-react";

import { apiRequest } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const useRealTimeNow = (updateInterval = 60000, enabled = true) => {
  const [now, setNow] = useState(() => new Date());
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setNow(new Date());

    intervalRef.current = setInterval(() => {
      setNow(new Date());
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateInterval, enabled]);

  return now;
};

const useExamAwareRealTimeNow = (exams = [], updateInterval = 60000) => {
  const [now, setNow] = useState(() => new Date());
  const intervalRef = useRef(null);

  const needsRealTimeUpdates = useMemo(() => {
    if (!exams || exams.length === 0) return false;

    const currentTime = Date.now();
    const bufferTime = updateInterval * 2;

    return exams.some(exam => {
      const startDate = dateUtilities.parseDate(exam.start_date)?.getTime();
      const endDate = dateUtilities.parseDate(exam.end_date)?.getTime();

      if (!startDate || !endDate) return false;

      const isStartingSoon = startDate > currentTime && startDate - currentTime <= bufferTime;
      const isEndingSoon = endDate > currentTime && endDate - currentTime <= bufferTime;
      const isCurrentlyActive = startDate <= currentTime && endDate >= currentTime;

      return isStartingSoon || isEndingSoon || isCurrentlyActive;
    });
  }, [exams, updateInterval]);

  useEffect(() => {
    if (!needsRealTimeUpdates) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setNow(new Date());
      return;
    }

    setNow(new Date());

    intervalRef.current = setInterval(() => {
      setNow(new Date());
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [needsRealTimeUpdates, updateInterval]);

  return now;
};

const API_CONFIG = {
  ENDPOINTS: {
    STUDENT_EXAMS: "/api/v1/exam/student/exams",
    EXAM_DETAILS: (examId) => `/api/v1/exam/student/exams/${examId}`,
    START_EXAM: (examId) => `/api/v1/exam/student/exam/${examId}/start`,
  },
  HEADERS: {
    DEFAULT: {
      "Accept": "application/json"
    }
  }
};

const EXAM_STATUS = {
  COMPLETED: "completed",
  GRADED: "graded",
  UPCOMING: "upcoming",
  ACTIVE: "active",
};

const UI_CONSTANTS = {
  SKELETON_COUNT: 3,
  CALENDAR_DAYS: 35,
  MAX_UPCOMING_EXAMS: 3,
  MAX_RECENT_RESULTS: 3,
  VIRTUAL_OVERSCAN: 5,
  VIRTUALIZATION_THRESHOLD: 10
};

const TABS = {
  UPCOMING: "upcoming",
  RESULTS: "results"
};

const DATE_FORMAT_OPTIONS = {
  DATE_TIME: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
};

const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: "Unable to connect to the server. Please check your internet connection.",
  [ERROR_TYPES.VALIDATION]: "The provided data is invalid. Please refresh and try again.",
  [ERROR_TYPES.AUTHENTICATION]: "Your session has expired. Please log in again.",
  [ERROR_TYPES.NOT_FOUND]: "The requested exam could not be found.",
  [ERROR_TYPES.SERVER]: "Server is experiencing issues. Please try again in a few minutes.",
  [ERROR_TYPES.TIMEOUT]: "The request timed out. Please try again.",
  [ERROR_TYPES.UNKNOWN]: "An unexpected error occurred. Please try again."
};

const errorHandler = {
  categorizeError: (error) => {
    if (!error) return ERROR_TYPES.UNKNOWN;

    if (error.message?.includes('fetch') || error.message?.includes('network') || error.code === 'NETWORK_ERR') {
      return ERROR_TYPES.NETWORK;
    }

    if (error.status) {
      switch (error.status) {
        case 401:
        case 403:
          return ERROR_TYPES.AUTHENTICATION;
        case 404:
          return ERROR_TYPES.NOT_FOUND;
        case 422:
          return ERROR_TYPES.VALIDATION;
        case 500:
        case 502:
        case 503:
          return ERROR_TYPES.SERVER;
        case 408:
          return ERROR_TYPES.TIMEOUT;
        default:
          return ERROR_TYPES.UNKNOWN;
      }
    }

    if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
      return ERROR_TYPES.TIMEOUT;
    }

    if (error.message?.includes('invalid') || error.message?.includes('validation')) {
      return ERROR_TYPES.VALIDATION;
    }

    return ERROR_TYPES.UNKNOWN;
  },

  getDetailedErrorMessage: (error, context = '') => {
    const errorType = errorHandler.categorizeError(error);
    const baseMessage = ERROR_MESSAGES[errorType];

    let detailedMessage = baseMessage;

    if (context) {
      detailedMessage = `${context}: ${baseMessage}`;
    }

    return {
      message: detailedMessage,
      type: errorType,
      canRetry: [ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER, ERROR_TYPES.TIMEOUT].includes(errorType)
    };
  }
};

const STYLES = {
  EXAM_DAY: {
    ACTIVE: "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-800/50",
    UPCOMING: "bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 font-medium hover:bg-blue-100 dark:hover:bg-blue-800/50",
    PAST: "bg-slate-50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/50",
    TODAY: "bg-accent/30 dark:bg-accent/40 border border-neutral-400 dark:border-neutral-500 text-accent-foreground font-semibold shadow-sm hover:bg-accent/40 dark:hover:bg-accent/50",
    HOVER: "hover:bg-accent/10 dark:hover:bg-accent/20 hover:text-accent-foreground",
  },
  BADGE: {
    IN_PROGRESS: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    PASSED: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200",
    FAILED: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200",
    PENDING: "bg-gray-50 dark:bg-muted/30 text-gray-700 dark:text-gray-300"
  },
  CARD: {
    BASE: "p-4",
    EXAM_ITEM: "border rounded-md bg-white dark:bg-muted/20 cursor-pointer hover:bg-gray-50 dark:hover:bg-muted/40 hover:shadow-sm transition-shadow p-4",
    ACTIVE_EXAM: "shadow-sm hover:bg-muted/20 transition-all duration-200 cursor-pointer mt-6",
    DETAILS_GRID_ITEM: "p-4 bg-white dark:bg-neutral-900 rounded shadow-sm",
    SKELETON_ITEM: "bg-muted/5 dark:bg-muted/20 rounded-md p-4",
    CONTENT: "p-4"
  },
  DIALOG: {
    CONTENT: "sm:max-w-2xl max-h-[80vh] overflow-y-auto border-2 border-gray-200 dark:border-neutral-900 rounded-lg bg-white dark:bg-neutral-950",
    HEADER: "border-b border-gray-200 dark:border-neutral-900 p-4",
    FOOTER: "flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-neutral-900",
    SEPARATOR: "pt-6 border-t border-gray-200 dark:border-neutral-800"
  },
  LEGEND: {
    UPCOMING: "h-3 w-3 rounded mr-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700",
    ACTIVE: "h-3 w-3 rounded mr-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700",
    PAST: "h-3 w-3 rounded mr-1 bg-slate-50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-700",
    UPCOMING_TEXT: "text-xs text-blue-800 dark:text-blue-300 font-medium",
    ACTIVE_TEXT: "text-xs text-amber-800 dark:text-amber-300 font-medium",
    PAST_TEXT: "text-xs text-slate-800 dark:text-slate-300 font-medium"
  },
  CALENDAR: {
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full pr-10",
    month: "space-y-4 w-full",
    caption: "flex justify-center pt-1 relative items-center w-full py-2",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center absolute inset-x-0 top-1/2 transform -translate-y-1/2 justify-between px-2",
    nav_button: "h-7 w-7 rounded-md flex items-center justify-center bg-transparent opacity-50",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex w-full",
    head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: "text-center text-sm p-0 relative flex-1 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: "h-8 w-full p-0 font-normal",
    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    day_today: "bg-gray-200 dark:bg-gray-700 text-accent-foreground font-medium",
    day_outside: "text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50",
    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
  }
};

const dateUtilities = {
  _currentDate: null,
  _currentDateCacheTime: 0,
  _currentDateCacheExpiry: 60000,

  getCurrentDate: function () {
    const now = Date.now();
    if (!this._currentDate || (now - this._currentDateCacheTime) > this._currentDateCacheExpiry) {
      this._currentDate = new Date();
      this._currentDateCacheTime = now;
    }
    return this._currentDate;
  },

  parseDate: (dateString) => {
    if (!dateString) return null;

    try {
      const hasTimezone = /[+-]\d{2}:?\d{2}$|Z$/.test(dateString.trim());

      let date;
      if (hasTimezone) {
        date = new Date(dateString);
      } else {
        const utcDate = new Date(dateString + (dateString.includes('T') ? 'Z' : 'T00:00:00Z'));
        date = utcDate;
      }

      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${dateString}`);
        return null;
      }

      return date;
    } catch (error) {
      console.warn(`Error parsing date string: ${dateString}`, error);
      return null;
    }
  },

  formatDateTimeWithoutSeconds: (dateString) => {
    const date = dateUtilities.parseDate(dateString);
    if (!date) return "Invalid Date";

    return new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS.DATE_TIME).format(date);
  },

  formatDuration: (startDate, endDate) => {
    const start = dateUtilities.parseDate(startDate);
    const end = dateUtilities.parseDate(endDate);

    if (!start || !end) return "Unknown duration";

    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    if (durationMinutes >= 1440) {
      const hours = Math.floor(durationMinutes / 60);
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;

      if (remainingHours === 0) {
        return `${days} day${days !== 1 ? 's' : ''}`;
      } else {
        return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
      }
    } else if (durationMinutes > 60) {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      if (minutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
    } else {
      return `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`;
    }
  },

  checkIsToday: (date) => {
    if (!date) return false;

    const now = dateUtilities.getCurrentDate();
    let targetDate;

    if (date instanceof Date) {
      targetDate = date;
    } else if (typeof date === 'string') {
      targetDate = dateUtilities.parseDate(date);
    } else {
      return false;
    }

    if (!targetDate) return false;

    return now.getFullYear() === targetDate.getFullYear() &&
      now.getMonth() === targetDate.getMonth() &&
      now.getDate() === targetDate.getDate();
  },

  checkIsExamActive: (startDateString, endDateString) => {
    const now = dateUtilities.getCurrentDate();
    const startDate = dateUtilities.parseDate(startDateString);
    const endDate = dateUtilities.parseDate(endDateString);

    if (!startDate || !endDate) return false;

    const nowTime = now.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return startTime <= nowTime && endTime >= nowTime;
  },

  checkIsExamUpcoming: (startDateString) => {
    const now = dateUtilities.getCurrentDate();
    const startDate = dateUtilities.parseDate(startDateString);

    if (!startDate) return false;

    return startDate.getTime() > now.getTime();
  },

  deriveExamStatus: (exam, currentTime = dateUtilities.getCurrentDate()) => {
    if (exam.status && Object.values(EXAM_STATUS).includes(exam.status)) {
      const startDate = dateUtilities.parseDate(exam.start_date);
      const endDate = dateUtilities.parseDate(exam.end_date);

      if (startDate && endDate) {
        const currentTimestamp = currentTime.getTime();
        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        const isCurrentlyActive = startTimestamp <= currentTimestamp && endTimestamp >= currentTimestamp;
        const isCurrentlyUpcoming = startTimestamp > currentTimestamp;

        if (exam.status === EXAM_STATUS.UPCOMING && isCurrentlyActive) {
          return EXAM_STATUS.ACTIVE;
        }
        if (exam.status === EXAM_STATUS.ACTIVE && isCurrentlyUpcoming) {
          return EXAM_STATUS.UPCOMING;
        }

        return exam.status;
      }

      return exam.status;
    }

    if (dateUtilities.checkIsExamUpcoming(exam.start_date)) {
      return EXAM_STATUS.UPCOMING;
    } else if (dateUtilities.checkIsExamActive(exam.start_date, exam.end_date)) {
      return EXAM_STATUS.ACTIVE;
    } else {
      return "past";
    }
  },

  getStartOfDay: (date) => {
    if (!date) return null;

    const d = date instanceof Date ? date : dateUtilities.parseDate(date);
    if (!d) return null;

    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  },

  getEndOfDay: (date) => {
    if (!date) return null;

    const d = date instanceof Date ? date : dateUtilities.parseDate(date);
    if (!d) return null;

    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
};

const apiService = {
  _examDetailsCache: new Map(),
  _cacheTimestamps: new Map(),
  _cacheExpiry: 5 * 60 * 1000,

  _validateCacheEntry: function (examId) {
    const timestamp = this._cacheTimestamps.get(examId);
    if (!timestamp) return false;

    return Date.now() - timestamp < this._cacheExpiry;
  },

  _storeCacheEntry: function (examId, data) {
    this._examDetailsCache.set(examId, data);
    this._cacheTimestamps.set(examId, Date.now());
  },

  async fetchStudentExamsData() {
    try {
      const studentExamsData = await apiRequest(
        API_CONFIG.ENDPOINTS.STUDENT_EXAMS,
        {
          headers: API_CONFIG.HEADERS.DEFAULT
        }
      );

      if (!studentExamsData || typeof studentExamsData !== 'object') {
        const error = new Error("API returned invalid data format");
        error.status = 422;
        throw error;
      }

      return (studentExamsData?.data || []).map(exam => {
        const examData = exam.exam_instance_id || exam;
        const processedExam = {
          _id: exam.id || exam._id,
          title: examData.title,
          start_date: examData.start_date,
          end_date: examData.end_date,
          status: examData.status,
          passing_score: examData.passing_score,
          max_attempts: examData.max_attempts,
          score: examData.score,
          passed: examData.passed !== undefined ? examData.passed : null,
          submitted_at: examData.submitted_at
        };

        processedExam.status = dateUtilities.deriveExamStatus(processedExam);

        return processedExam;
      });
    } catch (error) {
      const enhancedError = new Error("Failed to fetch student exams");
      enhancedError.originalError = error;
      enhancedError.status = error.status || 500;
      enhancedError.context = 'fetchStudentExamsData';
      throw enhancedError;
    }
  },

  async fetchExamDetailsData(examId) {
    if (this._validateCacheEntry(examId)) {
      return this._examDetailsCache.get(examId);
    }

    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.EXAM_DETAILS(examId));

      if (!response || typeof response !== 'object') {
        const error = new Error("Invalid API response");
        error.status = 422;
        throw error;
      }

      const data = response.data;
      const examDetails = {
        ...data.exam_instance_id,
        _id: examId,
        question_count: data.question_count,
        attempts_allowed: data.attempts_allowed,
        start_date: data.exam_instance_id?.start_date,
        end_date: data.exam_instance_id?.end_date,
        passing_score: data.exam_instance_id?.passing_score,
        title: data.exam_instance_id?.title,
        description: data.exam_instance_id?.description
      };

      this._storeCacheEntry(examId, examDetails);

      return examDetails;
    } catch (error) {
      const enhancedError = new Error("Failed to fetch exam details");
      enhancedError.originalError = error;
      enhancedError.status = error.status || 500;
      enhancedError.context = 'fetchExamDetailsData';
      enhancedError.examId = examId;
      throw enhancedError;
    }
  },

  async fetchBatchExamDetailsData(examIds) {
    const results = [];
    const uncachedIds = [];

    for (const examId of examIds) {
      if (this._validateCacheEntry(examId)) {
        results.push({
          examId,
          data: this._examDetailsCache.get(examId),
          fromCache: true
        });
      } else {
        uncachedIds.push(examId);
      }
    }

    if (uncachedIds.length > 0) {
      const fetchPromises = uncachedIds.map(async (examId) => {
        try {
          const data = await this.fetchExamDetailsData(examId);
          return { examId, data, fromCache: false };
        } catch (error) {
          console.error(`Failed to fetch exam ${examId}:`, error);
          return { examId, data: null, error: error.message };
        }
      });

      const fetchResults = await Promise.all(fetchPromises);
      results.push(...fetchResults);
    }

    const sortedResults = examIds.map(examId =>
      results.find(result => result.examId === examId)
    ).filter(result => result && result.data);

    return sortedResults.map(result => result.data);
  }
};

const dataProcessor = {
  processStudentDashboardData(studentExams) {
    const now = dateUtilities.getCurrentDate();
    const nowTime = now.getTime();

    const upcomingExamsList = studentExams
      .filter(exam => {
        const startDate = dateUtilities.parseDate(exam.start_date);
        return startDate && startDate.getTime() > nowTime;
      })
      .sort((a, b) => {
        const dateA = dateUtilities.parseDate(a.start_date);
        const dateB = dateUtilities.parseDate(b.start_date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, UI_CONSTANTS.MAX_UPCOMING_EXAMS);

    const activeExamsList = studentExams
      .filter(exam => {
        return dateUtilities.checkIsExamActive(exam.start_date, exam.end_date);
      })
      .sort((a, b) => {
        const dateA = dateUtilities.parseDate(a.end_date);
        const dateB = dateUtilities.parseDate(b.end_date);
        return dateA.getTime() - dateB.getTime();
      });

    const pastExams = studentExams.filter(exam => {
      const endDate = dateUtilities.parseDate(exam.end_date);
      return endDate && endDate.getTime() < nowTime;
    });

    const recentResultsList = pastExams
      .sort((a, b) => {
        const dateA = dateUtilities.parseDate(a.submitted_at || a.end_date);
        const dateB = dateUtilities.parseDate(b.submitted_at || b.end_date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, UI_CONSTANTS.MAX_RECENT_RESULTS)
      .map(exam => ({
        _id: exam._id,
        title: exam.title,
        score: exam.score || "N/A",
        passed: exam.passed !== undefined ? exam.passed : null,
        submitted_at: exam.submitted_at || exam.end_date,
        status: exam.status
      }));

    const calendarEventsList = studentExams
      .map(exam => {
        const startDate = dateUtilities.parseDate(exam.start_date);
        const endDate = dateUtilities.parseDate(exam.end_date);

        if (!startDate || !endDate) {
          console.warn(`Invalid dates for exam ${exam._id}:`, exam.start_date, exam.end_date);
          return null;
        }

        return {
          _id: exam._id,
          title: exam.title,
          start_date: startDate,
          end_date: endDate,
          status: exam.status
        };
      })
      .filter(event => event !== null);

    return {
      upcomingExams: upcomingExamsList,
      activeExams: activeExamsList,
      recentResults: recentResultsList,
      calendarEvents: calendarEventsList,
      allExams: studentExams
    };
  }
};

const VirtualList = memo(({
  items,
  renderItem,
  className = "h-[50vh] max-h-96",
  itemHeight = 80
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const getStableKey = useCallback((item, globalIndex) => {
    if (item._id) return item._id;
    if (item.id) return item.id;
    console.warn(
      '[VirtualList] item is missing a unique id; falling back to index —\n',
      item
    );
    return String(globalIndex);
  }, []);

  const containerRef = useCallback((node) => {
    if (node) {
      setContainerHeight(node.offsetHeight);
    }
  }, []);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + UI_CONSTANTS.VIRTUAL_OVERSCAN,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, localIndex) => {
            const globalIndex = visibleStart + localIndex;
            return (
              <div
                key={getStableKey(item, globalIndex)}
                style={{ height: itemHeight }}
              >
                {renderItem(item, globalIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

const renderUtilities = {
  renderSkeletonItemsList: (count, className = "") => (
    Array.from({ length: count }).map((_, i) => (
      <Skeleton key={`skeleton-${i}`} className={`h-6 rounded ${className}`} />
    ))
  ),

  renderExamStatusBadge: (passed, status) => {
    if (passed !== null) {
      return (
        <span className={`text-sm px-2 py-0.5 rounded-sm ${passed
          ? STYLES.BADGE.PASSED
          : STYLES.BADGE.FAILED}`}>
          {passed ? "Passed" : "Failed"}
        </span>
      );
    }

    if (status === EXAM_STATUS.COMPLETED || status === EXAM_STATUS.GRADED) {
      return (
        <span className={`text-sm px-2 py-0.5 rounded-sm ${STYLES.BADGE.PENDING}`}>
          Pending
        </span>
      );
    }
    return null;
  },

  renderExamDetailsGrid: (details) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div className={STYLES.CARD.DETAILS_GRID_ITEM}>
        <p className="text-xs text-muted-foreground">Duration</p>
        <p className="font-medium">
          {dateUtilities.formatDuration(details.start_date, details.end_date)}
        </p>
      </div>

      <div className={STYLES.CARD.DETAILS_GRID_ITEM}>
        <p className="text-xs text-muted-foreground">Questions</p>
        <p className="font-medium">{details.question_count || '-'}</p>
      </div>

      <div className={STYLES.CARD.DETAILS_GRID_ITEM}>
        <p className="text-xs text-muted-foreground">Passing Score</p>
        <p className="font-medium">{details.passing_score || '-'}%</p>
      </div>

      <div className={STYLES.CARD.DETAILS_GRID_ITEM}>
        <p className="text-xs text-muted-foreground">Start Date</p>
        <p className="font-medium">{dateUtilities.formatDateTimeWithoutSeconds(details.start_date)}</p>
      </div>

      <div className={STYLES.CARD.DETAILS_GRID_ITEM}>
        <p className="text-xs text-muted-foreground">End Date</p>
        <p className="font-medium">{dateUtilities.formatDateTimeWithoutSeconds(details.end_date)}</p>
      </div>

      <div className={STYLES.CARD.DETAILS_GRID_ITEM}>
        <p className="text-xs text-muted-foreground">Attempts Allowed</p>
        <p className="font-medium">{details.attempts_allowed || details.max_attempts || UI_CONSTANTS.DEFAULT_MAX_ATTEMPTS}</p>
      </div>
    </div>
  ),

  renderLoadingExamCardsList: () => (
    <div className="space-y-4">
      {Array.from({ length: UI_CONSTANTS.SKELETON_COUNT }).map((_, i) => (
        <div key={`loading-exam-${i}`} className={`animate-pulse ${STYLES.CARD.BASE}`}>
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {renderUtilities.renderSkeletonItemsList(6)}
          </div>
        </div>
      ))}
    </div>
  ),

  renderCalendarSkeletonGrid: () => (
    <div className="grid grid-cols-7 gap-0.5">
      {renderUtilities.renderSkeletonItemsList(UI_CONSTANTS.CALENDAR_DAYS)}
    </div>
  )
};

const renderUtilitiesWithRealTime = {
  renderExamActionButton: (examStart, examEnd, examId, onStartExam, realTimeNow, isStartingExam = false) => {
    const startDate = dateUtilities.parseDate(examStart);
    const endDate = dateUtilities.parseDate(examEnd);

    if (!startDate || !endDate) {
      return (
        <span className="text-sm text-red-600 dark:text-red-400">
          Invalid exam dates.
        </span>
      );
    }

    const nowTime = realTimeNow.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const isActive = startTime <= nowTime && endTime >= nowTime;
    const isUpcoming = startTime > nowTime;

    if (isActive) {
      return (
        <Button
          onClick={() => onStartExam(examId)}
          disabled={isStartingExam}
          className="inline-flex items-center"
        >
          {isStartingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isStartingExam ? "Starting..." : "Start Exam"}
          {!isStartingExam && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      );
    } else if (isUpcoming) {
      return (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          This exam has not started yet.
        </span>
      );
    } else {
      return (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          This exam has ended.
        </span>
      );
    }
  }
};

const CalendarDayWithRealTime = ({ date, dashboardData, onDayExamsClick, realTimeNow }) => {
  const examsOnThisDay = useMemo(() => {
    if (!date || !dashboardData.calendarEvents) return [];

    return dashboardData.calendarEvents.filter(event => {
      if (!event.start_date || !event.end_date) return false;

      const startDate = event.start_date instanceof Date ? event.start_date : dateUtilities.parseDate(event.start_date);
      const endDate = event.end_date instanceof Date ? event.end_date : dateUtilities.parseDate(event.end_date);

      if (!startDate || !endDate) return false;

      const currentDayStart = dateUtilities.getStartOfDay(date);
      const currentDayEnd = dateUtilities.getEndOfDay(date);

      if (!currentDayStart || !currentDayEnd) return false;

      return startDate.getTime() <= currentDayEnd.getTime() && endDate.getTime() >= currentDayStart.getTime();
    });
  }, [dashboardData.calendarEvents, date]);

  const dayStatus = useMemo(() => {
    if (!date) return { isTodayDate: false, hasActiveExam: false, hasUpcomingExam: false, hasPastExam: false };

    const isTodayDate = realTimeNow.getFullYear() === date.getFullYear() &&
      realTimeNow.getMonth() === date.getMonth() &&
      realTimeNow.getDate() === date.getDate();

    const hasActiveExam = examsOnThisDay.some(exam => {
      const examStart = exam.start_date instanceof Date ? exam.start_date : dateUtilities.parseDate(exam.start_date);
      const examEnd = exam.end_date instanceof Date ? exam.end_date : dateUtilities.parseDate(exam.end_date);

      if (!examStart || !examEnd) return false;

      const nowTime = realTimeNow.getTime();
      return examStart.getTime() <= nowTime && examEnd.getTime() >= nowTime;
    });

    const hasUpcomingExam = !hasActiveExam && examsOnThisDay.some(exam => {
      const examStart = exam.start_date instanceof Date ? exam.start_date : dateUtilities.parseDate(exam.start_date);

      if (!examStart) return false;

      return examStart.getTime() > realTimeNow.getTime();
    });

    const hasPastExam = !hasActiveExam && !hasUpcomingExam && examsOnThisDay.some(exam => {
      const examEnd = exam.end_date instanceof Date ? exam.end_date : dateUtilities.parseDate(exam.end_date);

      if (!examEnd) return false;

      return examEnd.getTime() < realTimeNow.getTime();
    });

    return { isTodayDate, hasActiveExam, hasUpcomingExam, hasPastExam };
  }, [examsOnThisDay, date, realTimeNow]);

  const dayClasses = useMemo(() => {
    let classes = "h-8 w-full p-0 rounded-md flex items-center justify-center text-xs ";

    if (dayStatus.hasActiveExam) {
      classes += STYLES.EXAM_DAY.ACTIVE;
    } else if (dayStatus.hasUpcomingExam) {
      classes += STYLES.EXAM_DAY.UPCOMING;
    } else if (dayStatus.hasPastExam) {
      classes += STYLES.EXAM_DAY.PAST;
    } else if (dayStatus.isTodayDate) {
      classes += STYLES.EXAM_DAY.TODAY;
    } else {
      classes += STYLES.EXAM_DAY.HOVER;
    }

    if (examsOnThisDay.length > 0) {
      classes += " cursor-pointer";
    }

    return classes;
  }, [dayStatus, examsOnThisDay.length]);

  const handleClick = useCallback((e) => {
    if (examsOnThisDay.length > 0) {
      e.stopPropagation();
      onDayExamsClick(examsOnThisDay);
    }
  }, [examsOnThisDay, onDayExamsClick]);

  return (
    <div className={dayClasses} onClick={handleClick}>
      {date ? date.getDate() : ''}
    </div>
  );
};

CalendarDayWithRealTime.displayName = 'CalendarDayWithRealTime';

const ExamItem = ({ exam, onExamSelect }) => {
  const handleClick = () => onExamSelect(exam._id);
  return (
    <div
      className={STYLES.CARD.EXAM_ITEM}
      onClick={handleClick}
    >
      <div className="text-base font-medium truncate">{exam.title}</div>
      <div className="text-sm text-muted-foreground mt-1.5">
        Starts: {dateUtilities.formatDateTimeWithoutSeconds(exam.start_date)}
      </div>
    </div>
  );
};

ExamItem.displayName = 'ExamItem';

const ResultItem = ({ result, onExamSelect }) => {
  const handleClick = () => onExamSelect(result._id);

  const handleViewResults = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/exams/${result._id}/results`;
  };

  return (
    <div
      className={STYLES.CARD.EXAM_ITEM + " py-2"} 
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base font-medium truncate pr-2">{result.title}</span>
          <span className="text-xs text-muted-foreground">
            {result.status === "completed" || result.status === "graded"
              ? `Completed: ${dateUtilities.formatDateTimeWithoutSeconds(result.submitted_at)}`
              : `Ended: ${dateUtilities.formatDateTimeWithoutSeconds(result.submitted_at)}`}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2">
          {renderUtilities.renderExamStatusBadge(result.passed, result.status)}
          <Button
            onClick={handleViewResults}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Results
          </Button>
        </div>
      </div>
    </div>
  );
};


ResultItem.displayName = 'ResultItem';

const ActiveExamCardWithRealTime = memo(({ activeExam, onExamSelect, realTimeNow }) => {
  const isStillActive = useMemo(() => {
    const startDate = dateUtilities.parseDate(activeExam.start_date);
    const endDate = dateUtilities.parseDate(activeExam.end_date);

    if (!startDate || !endDate) return false;

    const nowTime = realTimeNow.getTime();
    return startDate.getTime() <= nowTime && endDate.getTime() >= nowTime;
  }, [activeExam.start_date, activeExam.end_date, realTimeNow]);

  const handleClick = useCallback(() => {
    onExamSelect(activeExam._id);
  }, [activeExam._id, onExamSelect]);

  if (!isStillActive) {
    return null;
  }

  return (
    <Card
      className={STYLES.CARD.ACTIVE_EXAM}
      onClick={handleClick}
    >
      <CardContent className={STYLES.CARD.CONTENT}>
        <div className="flex items-center gap-3 mb-3">
          <Clock className="h-5 w-5 text-gray-500 dark:text-amber-500" />
          <h3 className="text-base font-medium text-gray-700 dark:text-white">Active Exam</h3>
        </div>

        <div>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-100">{activeExam.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ends: {dateUtilities.formatDateTimeWithoutSeconds(activeExam.end_date)}
              </p>
            </div>
            <div>
              <Badge variant="outline" className={`${STYLES.BADGE.IN_PROGRESS} shadow-sm`}>
                In Progress
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ActiveExamCardWithRealTime.displayName = 'ActiveExamCardWithRealTime';

export function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState({
    upcomingExams: [],
    activeExams: [],
    recentResults: [],
    calendarEvents: [],
    allExams: []
  });

  const [loadingState, setLoadingState] = useState({
    dashboard: true,
    examDetails: false,
    multipleExams: false,
    startingExam: null
  });

  const [errorState, setErrorState] = useState({
    message: null,
    type: null,
    canRetry: false
  });

  const [currentDate, setCurrentDate] = useState(() => dateUtilities.getCurrentDate());
  const [activeTab, setActiveTab] = useState(TABS.UPCOMING);

  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [multipleExamDetails, setMultipleExamDetails] = useState([]);

  const realTimeNow = useExamAwareRealTimeNow(dashboardData.allExams, 60000);

  const handleFetchDashboardData = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, dashboard: true }));
    setErrorState({ message: null, type: null, canRetry: false });

    try {
      const studentExams = await apiService.fetchStudentExamsData();
      const processedData = dataProcessor.processStudentDashboardData(studentExams);
      setDashboardData(processedData);
    } catch (error) {
      const errorDetails = errorHandler.getDetailedErrorMessage(error, 'Loading dashboard data');
      setErrorState(errorDetails);
    } finally {
      setLoadingState(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  const handleFetchExamDetails = useCallback(async (examId) => {
    setLoadingState(prev => ({ ...prev, examDetails: true }));

    try {
      const details = await apiService.fetchExamDetailsData(examId);
      setExamDetails(details);
    } catch (error) {
      const errorDetails = errorHandler.getDetailedErrorMessage(error, 'Loading exam details');
      setErrorState(errorDetails);
    } finally {
      setLoadingState(prev => ({ ...prev, examDetails: false }));
    }
  }, []);

  const handleExamSelect = useCallback((examId) => {
    setSelectedExamId(examId);
    setMultipleExamDetails([]);
  }, []);

  const handleCloseExamDetails = useCallback(() => {
    setSelectedExamId(null);
    setExamDetails(null);
  }, []);

  const handleDayExamsClick = useCallback(async (exams) => {
    if (exams.length === 1) {
      handleExamSelect(exams[0]._id);
    } else if (exams.length > 1) {
      setLoadingState(prev => ({ ...prev, multipleExams: true }));
      setMultipleExamDetails([]);
      setSelectedExamId(null);

      try {
        const examIds = exams.map(exam => exam._id);
        const allExamDetails = await apiService.fetchBatchExamDetailsData(examIds);
        setMultipleExamDetails(allExamDetails);
      } catch (error) {
        const errorDetails = errorHandler.getDetailedErrorMessage(error, 'Loading multiple exam details');
        setErrorState(errorDetails);
      } finally {
        setLoadingState(prev => ({ ...prev, multipleExams: false }));
      }
    }
  }, [handleExamSelect]);

  const handleCloseMultipleExams = useCallback(() => {
    setMultipleExamDetails([]);
  }, []);

  const handleStartExam = useCallback(async (examId) => {
    setLoadingState(prev => ({ ...prev, startingExam: examId }));

    try {
      window.location.href = `/exams/${examId}/take`;
    } catch (error) {
      const errorDetails = errorHandler.getDetailedErrorMessage(error, 'Starting exam');
      setErrorState(errorDetails);
    } finally {
      setLoadingState(prev => ({ ...prev, startingExam: null }));
    }
  }, []);

  const handleViewResults = useCallback((examId) => {
    window.location.href = `/exams/${examId}/results`;
  }, []);

  const handleDateSelect = useCallback((date) => {
    setCurrentDate(date);
  }, []);

  const handleRetryAction = useCallback(() => {
    handleFetchDashboardData();
  }, [handleFetchDashboardData]);

  const renderCalendarDay = useCallback(({ date, ...props }) => (
    <CalendarDayWithRealTime
      date={date}
      dashboardData={dashboardData}
      onDayExamsClick={handleDayExamsClick}
      realTimeNow={realTimeNow}
      {...(({ displayMonth, ...rest }) => rest)(props)}
    />
  ), [dashboardData, handleDayExamsClick, realTimeNow]);

  const renderUpcomingExamItem = useCallback((exam) => (
    <ExamItem
      exam={exam}
      onExamSelect={handleExamSelect}
    />
  ), [handleExamSelect]);

  const renderResultItem = useCallback((result) => (
    <ResultItem
      result={result}
      onExamSelect={handleExamSelect}
    />
  ), [handleExamSelect, handleViewResults]);

  const currentActiveExams = useMemo(() => {
    return dashboardData.activeExams.filter(exam => {
      const startDate = dateUtilities.parseDate(exam.start_date);
      const endDate = dateUtilities.parseDate(exam.end_date);

      if (!startDate || !endDate) return false;

      const nowTime = realTimeNow.getTime();
      return startDate.getTime() <= nowTime && endDate.getTime() >= nowTime;
    });
  }, [dashboardData.activeExams, realTimeNow]);

  const renderUpcomingExamsContent = useMemo(() => {
    if (loadingState.dashboard) {
      return (
        <div className="space-y-3">
          {renderUtilities.renderSkeletonItemsList(UI_CONSTANTS.SKELETON_COUNT, STYLES.CARD.SKELETON_ITEM)}
        </div>
      );
    }

    if (dashboardData.upcomingExams.length === 0) {
      return <p className="text-muted-foreground text-base p-4">No upcoming exams scheduled.</p>;
    }

    if (dashboardData.upcomingExams.length > UI_CONSTANTS.VIRTUALIZATION_THRESHOLD) {
      return (
        <div className={STYLES.CARD.BASE}>
          <VirtualList
            items={dashboardData.upcomingExams}
            renderItem={renderUpcomingExamItem}
            className="h-[50vh] max-h-96 min-h-[200px]"
            itemHeight={80}
          />
        </div>
      );
    }

    return (
      <div className={`space-y-3 ${STYLES.CARD.BASE}`}>
        {dashboardData.upcomingExams.map((exam) => (
          <ExamItem
            key={`exam-${exam._id}`}
            exam={exam}
            onExamSelect={handleExamSelect}
          />
        ))}
      </div>
    );
  }, [loadingState.dashboard, dashboardData.upcomingExams, handleExamSelect, renderUpcomingExamItem]);

  const renderRecentResultsContent = useMemo(() => {
    if (loadingState.dashboard) {
      return (
        <div className="space-y-3">
          {renderUtilities.renderSkeletonItemsList(UI_CONSTANTS.SKELETON_COUNT, STYLES.CARD.SKELETON_ITEM)}
        </div>
      );
    }

    if (dashboardData.recentResults.length === 0) {
      return <p className="text-muted-foreground text-base p-4">No recent exam results.</p>;
    }

    if (dashboardData.recentResults.length > UI_CONSTANTS.VIRTUALIZATION_THRESHOLD) {
      return (
        <div className={STYLES.CARD.BASE}>
          <VirtualList
            items={dashboardData.recentResults}
            renderItem={renderResultItem}
            className="h-[50vh] max-h-96 min-h-[200px]"
            itemHeight={80}
          />
        </div>
      );
    }

    return (
      <div className={`space-y-3 ${STYLES.CARD.BASE}`}>
        {dashboardData.recentResults.map((result) => (
          <ResultItem
            key={`result-${result._id}`}
            result={result}
            onExamSelect={handleExamSelect}
          />
        ))}
      </div>
    );
  }, [loadingState.dashboard, dashboardData.recentResults, handleExamSelect, renderResultItem]);

  useEffect(() => {
    handleFetchDashboardData();
  }, [handleFetchDashboardData]);

  useEffect(() => {
    if (selectedExamId) {
      handleFetchExamDetails(selectedExamId);
    }
  }, [selectedExamId, handleFetchExamDetails]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white dark:bg-neutral-900">
            <CardContent className={STYLES.CARD.BASE}>
              <h1 className="text-3xl font-bold tracking-tight mb-3">Student Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome to your exam platform. Track your progress and upcoming exams.
              </p>
              {errorState.message && (
                <Alert variant="destructive" className="mt-3">
                  <AlertDescription>
                    <div>
                      {errorState.message}
                      {errorState.canRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRetryAction}
                          className="ml-2"
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {loadingState.dashboard ? (
            <Card className="shadow-sm mt-6">
              <CardContent className={STYLES.CARD.CONTENT}>
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : currentActiveExams && currentActiveExams.length > 0 ? (
            currentActiveExams.map((activeExam) => (
              <ActiveExamCardWithRealTime
                key={`active-exam-${activeExam._id}`}
                activeExam={activeExam}
                onExamSelect={handleExamSelect}
                realTimeNow={realTimeNow}
              />
            ))
          ) : null}

          <Dialog open={!!selectedExamId} onOpenChange={(open) => !open && handleCloseExamDetails()}>
            <DialogContent className={STYLES.DIALOG.CONTENT}>
              <div className={STYLES.DIALOG.HEADER}>
                <DialogTitle className="text-xl font-bold">Exam Details</DialogTitle>
                <DialogDescription className="mt-1">
                  View detailed information about this exam.
                </DialogDescription>
              </div>

              {loadingState.examDetails ? (
                <div className={`${STYLES.CARD.BASE} space-y-4`}>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                  <Skeleton className="h-4 w-full mt-6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : examDetails ? (
                <div className={`${STYLES.CARD.BASE} space-y-4`}>
                  <h3 className="text-xl font-semibold mb-2">{examDetails.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{examDetails.description || "No description provided."}</p>

                  {renderUtilities.renderExamDetailsGrid(examDetails)}

                  <div className={STYLES.DIALOG.FOOTER}>
                    {renderUtilitiesWithRealTime.renderExamActionButton(
                      examDetails.start_date,
                      examDetails.end_date,
                      selectedExamId,
                      handleStartExam,
                      realTimeNow,
                      loadingState.startingExam === selectedExamId
                    )}
                  </div>
                </div>
              ) : (
                <div className={STYLES.CARD.BASE}>
                  <p className="text-center text-muted-foreground">
                    Failed to load exam details. Please try again.
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={multipleExamDetails.length > 1} onOpenChange={(open) => !open && handleCloseMultipleExams()}>
            <DialogContent className={STYLES.DIALOG.CONTENT}>
              <div className={STYLES.DIALOG.HEADER}>
                <DialogTitle className="text-xl font-bold">Exams Details</DialogTitle>
                <DialogDescription className="mt-1">
                  View detailed information about exams scheduled for this day.
                </DialogDescription>
              </div>

              <ScrollArea className="max-h-[calc(80vh-12rem)]">
                <div className={STYLES.CARD.BASE}>
                  {loadingState.multipleExams ? (
                    renderUtilities.renderLoadingExamCardsList()
                  ) : (
                    <div className="space-y-6">
                      {multipleExamDetails.map((examDetail) => (
                        <div key={`exam-detail-${examDetail._id}`} className={multipleExamDetails.indexOf(examDetail) > 0 ? STYLES.DIALOG.SEPARATOR : ""}>
                          <h3 className="text-xl font-semibold mb-2">{examDetail.title}</h3>
                          <p className="text-muted-foreground text-sm mb-4">{examDetail.description || "No description provided."}</p>

                          {renderUtilities.renderExamDetailsGrid(examDetail)}

                          <div className="flex justify-end mt-4">
                            {renderUtilitiesWithRealTime.renderExamActionButton(
                              examDetail.start_date,
                              examDetail.end_date,
                              examDetail._id,
                              handleStartExam,
                              realTimeNow,
                              loadingState.startingExam === examDetail._id
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <div className="max-w-6xl mx-auto mt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Card className="md:w-1/3 w-full">
                <CardContent className={STYLES.CARD.BASE}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-xl pl-3">Exam Calendar</h3>
                  </div>

                  {loadingState.dashboard ? (
                    renderUtilities.renderCalendarSkeletonGrid()
                  ) : (
                    <div className="w-full">
                      <div className="mb-2 p-0 w-full ml-6 ">
                        <Calendar
                          mode="single"
                          selected={currentDate}
                          onSelect={(date) => {
                            if (date) {
                              handleDateSelect(date);
                              const examsOnThisDay = dashboardData.calendarEvents.filter(event => {
                                if (!event.start_date || !event.end_date) return false;

                                const startDate = event.start_date instanceof Date ? event.start_date : dateUtilities.parseDate(event.start_date);
                                const endDate = event.end_date instanceof Date ? event.end_date : dateUtilities.parseDate(event.end_date);

                                if (!startDate || !endDate) return false;

                                const currentDayStart = dateUtilities.getStartOfDay(date);
                                const currentDayEnd = dateUtilities.getEndOfDay(date);

                                if (!currentDayStart || !currentDayEnd) return false;

                                return startDate.getTime() <= currentDayEnd.getTime() && endDate.getTime() >= currentDayStart.getTime();
                              });

                              if (examsOnThisDay.length > 0) {
                                handleDayExamsClick(examsOnThisDay);
                              }
                            }
                          }}
                          className="p-0 w-full"
                          classNames={STYLES.CALENDAR}
                          components={{
                            Day: renderCalendarDay
                          }}
                        />
                      </div>

                      <div className="flex justify-end mt-2 pt-1 border-t dark:border-muted/20">
                        <div className="flex items-center mr-3">
                          <div className={STYLES.LEGEND.UPCOMING}></div>
                          <span className={STYLES.LEGEND.UPCOMING_TEXT}>Upcoming</span>
                        </div>
                        <div className="flex items-center mr-3">
                          <div className={STYLES.LEGEND.ACTIVE}></div>
                          <span className={STYLES.LEGEND.ACTIVE_TEXT}>Active</span>
                        </div>
                        <div className="flex items-center mr-9">
                          <div className={STYLES.LEGEND.PAST}></div>
                          <span className={STYLES.LEGEND.PAST_TEXT}>Past</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:w-2/3 w-full">
                <CardContent className={STYLES.CARD.BASE}>
                  <h3 className="text-xl font-semibold mb-3">Your Activity</h3>
                  <Tabs defaultValue={TABS.UPCOMING} value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex ml-8 sm:ml-12 md:ml-3">
                      <TabsList className="mb-4">
                        <TabsTrigger value={TABS.UPCOMING} className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Upcoming Exams</span>
                        </TabsTrigger>
                        <TabsTrigger value={TABS.RESULTS} className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <span>Recent Results</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value={TABS.UPCOMING} className="mt-0">
                      {renderUpcomingExamsContent}
                    </TabsContent>

                    <TabsContent value={TABS.RESULTS} className="mt-0">
                      {renderRecentResultsContent}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default StudentDashboard;