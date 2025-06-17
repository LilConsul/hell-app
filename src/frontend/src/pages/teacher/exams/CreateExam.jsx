import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentsTab } from "@/components/exams/teacher/tabs/students";
import { BasicInfoTab } from "@/components/exams/teacher/tabs/basic-info";
import { QuestionsTab } from "@/components/exams/teacher/tabs/questions/tab";
import { ExamSettingsTab } from "@/components/exams/teacher/tabs/exam-settings";
import { ExamHeader } from "@/components/exams/teacher/page-header";
import { PDFReportModal } from "@/components/exams/teacher/pdf-report-modal";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import examAPI from "./Exam.api";
import collectionAPI from "@/pages/teacher/collections/Collections.api";

function CreateExam() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = examId && examId !== 'new';
  const preselectedCollectionId = searchParams.get('collectionId');
  const action = searchParams.get('action');
  
  const [basicInfo, setBasicInfo] = useState({
    examTitle: "",
    selectedCollection: preselectedCollectionId || "",
    startDate: "",
    duration: "120",
    maxAttempts: 1,
    passingScore: 60
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  
  const [examSettings, setExamSettings] = useState({
    security_settings: {
      shuffle_questions: false,
      allow_review: true,
      prevent_tab_switching: false,
      tab_switch_limit: 0,
    },
    notification_settings: {
      reminder_enabled: true,
      reminders: ["2d", "1h", "20m"]
    }
  });

  // Store original data for comparison
  const [originalData, setOriginalData] = useState({
    basicInfo: null,
    examSettings: null,
    selectedStudentIds: null
  });

  const [loading, setLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsError, setStudentsError] = useState(null);
  const [collectionsError, setCollectionsError] = useState(null);
  const [examError, setExamError] = useState(null);

  const [pendingStudentIds, setPendingStudentIds] = useState([]);

  useEffect(() => {
    if (action === 'report') {
      setPdfModalOpen(true);
    }
  }, [action]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadStudents(),
        loadCollections()
      ]);
      
      if (isEditMode) {
        await loadExamData();
      }
    };
    
    loadData();
  }, [isEditMode, examId]);

  const utcToLocalDateTimeString = (utcString) => {
    if (!utcString) return "";
    
    const utcDate = new Date(utcString);
    if (isNaN(utcDate.getTime())) return "";
    
    const timezoneOffset = utcDate.getTimezoneOffset();
    const localDate = new Date(utcDate.getTime() - (timezoneOffset * 60000));
    return localDate.toISOString().slice(0, 16);
  };

  const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    if (Array.isArray(obj1)) {
      if (!Array.isArray(obj2) || obj1.length !== obj2.length) return false;
      return obj1.every((item, index) => deepEqual(item, obj2[index]));
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => deepEqual(obj1[key], obj2[key]));
  };
 
  const loadExamData = async () => {
    try {
      setExamLoading(true);
      setExamError(null);
      const response = await examAPI.getExam(examId);
      const examData = response.data;
      
      const loadedBasicInfo = {
        examTitle: examData.title,
        selectedCollection: examData.collection_id,
        startDate: utcToLocalDateTimeString(examData.start_date),
        duration: Math.round((new Date(examData.end_date) - new Date(examData.start_date)) / 60000).toString(),
        maxAttempts: examData.max_attempts,
        passingScore: examData.passing_score
      };
      
      const loadedExamSettings = {
        security_settings: {
          shuffle_questions: examData.security_settings.shuffle_questions,
          allow_review: examData.security_settings.allow_review,
          prevent_tab_switching: examData.security_settings.prevent_tab_switching,
          tab_switch_limit: examData.security_settings.tab_switch_limit || 0,
        },
        notification_settings: {
          reminder_enabled: examData.notification_settings.reminder_enabled,
          reminders: examData.notification_settings.reminders
        }
      };
      
      setBasicInfo(loadedBasicInfo);
      setExamSettings(loadedExamSettings);
      
      const assignedStudentIds = examData.assigned_students?.map(s => 
        typeof s === 'object' ? s.student_id : s
      ) || [];
      
      // Store original data immediately
      setOriginalData({
        basicInfo: { ...loadedBasicInfo },
        examSettings: JSON.parse(JSON.stringify(loadedExamSettings)),
        selectedStudentIds: [...assignedStudentIds]
      });
      
      if (students.length > 0) {
        const assignedStudents = students.filter(student => 
          assignedStudentIds.includes(student.id)
        );
        setSelectedStudents(assignedStudents);
      } else {
        setPendingStudentIds(assignedStudentIds);
      }
      
    } catch (error) {
      console.error("Failed to load exam data:", error);
      setExamError(error);
      toast.error("Failed to load exam data", {
        description: "Please try refreshing the page."
      });
    } finally {
      setExamLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      setStudentsError(null);
      const data = await examAPI.fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudentsError(error);
      toast.error("Failed to load students", {
        description: "Please try refreshing the page."
      });
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      setCollectionsLoading(true);
      setCollectionsError(null);
      const data = await collectionAPI.fetchCollections();
      setCollections(data);
    } catch (error) {
      console.error("Failed to load collections:", error);
      setCollectionsError(error);
      toast.error("Failed to load question collections", {
        description: "Please try refreshing the page."
      });
    } finally {
      setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    if (pendingStudentIds.length > 0 && students.length > 0) {
      const assignedStudents = students.filter(student => 
        pendingStudentIds.includes(student.id)
      );
      setSelectedStudents(assignedStudents);
      setPendingStudentIds([]);
    }
  }, [students, pendingStudentIds]);

  const handleStudentsChange = useCallback((newSelectedStudents) => {
    setSelectedStudents(newSelectedStudents);
  }, []);

  const calculateEndDate = (startDate, durationInMinutes) => {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + (durationInMinutes * 60000));
    return end.toISOString();
  };

  const validateForm = () => {
    if (!basicInfo.examTitle.trim()) {
      toast.error("Please enter an exam title");
      setActiveTab("basic");
      return false;
    }

    if (!basicInfo.selectedCollection) {
      toast.error("Please select a question collection");
      setActiveTab("basic");
      return false;
    }

    if (!basicInfo.startDate) {
      toast.error("Please set a start date");
      setActiveTab("basic");
      return false;
    }

    if (!basicInfo.duration || parseInt(basicInfo.duration) < 5) {
      toast.error("Please set a valid duration (at least 5 minutes)");
      setActiveTab("basic");
      return false;
    }

    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      setActiveTab("students");
      return false;
    }

    return true;
  };

  const getChangedData = () => {
    const changes = {};
    const original = originalData;
    
    if (!original.basicInfo) return null;

    // Check each basic info field individually
    if (basicInfo.examTitle !== original.basicInfo.examTitle) {
      changes.title = basicInfo.examTitle;
    }
    
    if (basicInfo.selectedCollection !== original.basicInfo.selectedCollection) {
      changes.collection_id = basicInfo.selectedCollection;
    }
    
    if (basicInfo.startDate !== original.basicInfo.startDate) {
      changes.start_date = basicInfo.startDate;
    }
    
    if (basicInfo.duration !== original.basicInfo.duration) {
      changes.end_date = utcToLocalDateTimeString(calculateEndDate(basicInfo.startDate, parseInt(basicInfo.duration)));
    }
    
    if (basicInfo.maxAttempts !== original.basicInfo.maxAttempts) {
      changes.max_attempts = basicInfo.maxAttempts;
    }
    
    if (basicInfo.passingScore !== original.basicInfo.passingScore) {
      changes.passing_score = basicInfo.passingScore;
    }

    // Check security settings
    const currentSecurity = examSettings.security_settings;
    const originalSecurity = original.examSettings.security_settings;
    
    if (currentSecurity.shuffle_questions !== originalSecurity.shuffle_questions ||
        currentSecurity.allow_review !== originalSecurity.allow_review ||
        currentSecurity.prevent_tab_switching !== originalSecurity.prevent_tab_switching ||
        currentSecurity.tab_switch_limit !== originalSecurity.tab_switch_limit) {
      changes.security_settings = currentSecurity;
    }
    
    // Check notification settings
    const currentNotifications = examSettings.notification_settings;
    const originalNotifications = original.examSettings.notification_settings;
    
    if (currentNotifications.reminder_enabled !== originalNotifications.reminder_enabled ||
        JSON.stringify(currentNotifications.reminders.sort()) !== JSON.stringify(originalNotifications.reminders.sort())) {
      changes.notification_settings = currentNotifications;
    }

    // Check student assignments
    const currentStudentIds = selectedStudents.map(s => s.id).sort();
    const originalStudentIds = [...original.selectedStudentIds].sort();
    
    if (JSON.stringify(currentStudentIds) !== JSON.stringify(originalStudentIds)) {
      changes.assigned_students = selectedStudents.map(student => ({
        student_id: student.id
      }));
    }

    return Object.keys(changes).length > 0 ? changes : null;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      let result;
      
      if (isEditMode) {
        const changedData = getChangedData();
        
        if (!changedData) {
          toast.info("No changes detected", {
            description: "The exam data is already up to date."
          });
          setLoading(false);
          return;
        }
        
        result = await examAPI.updateExam(examId, changedData);
        toast.success("Exam updated successfully!", {
          description: `${basicInfo.examTitle} has been updated.`
        });
      } else {
        const startDate = basicInfo.startDate;
        const endDate = calculateEndDate(basicInfo.startDate, parseInt(basicInfo.duration));

        const examData = {
          title: basicInfo.examTitle,
          start_date: startDate,
          end_date: utcToLocalDateTimeString(endDate), 
          max_attempts: basicInfo.maxAttempts,
          passing_score: basicInfo.passingScore,
          security_settings: examSettings.security_settings,
          notification_settings: examSettings.notification_settings,
          collection_id: basicInfo.selectedCollection,
          assigned_students: selectedStudents.map(student => ({
            student_id: student.id
          }))
        };
        
        result = await examAPI.createExam(examData);
        toast.success("Exam assigned successfully!", {
          description: `${basicInfo.examTitle} has been assigned to ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}.`
        });
        
        if (result.data) {
          navigate(`/exams/${result.data}`, { replace: true });
        }
      }
      
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} exam:`, error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'assign'} exam`, {
        description: error.message || "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePDFReportClick = () => {
    setPdfModalOpen(true);
  };

  const canSubmit = basicInfo.examTitle.trim() && 
    basicInfo.selectedCollection && 
    basicInfo.startDate && 
    basicInfo.duration && 
    parseInt(basicInfo.duration) >= 5 && 
    selectedStudents.length > 0;

  const headerProps = {
    title: isEditMode ? "Edit Exam" : "Assign New Exam",
    subtitle: isEditMode ? "Update exam details and settings" : "Create and assign an exam to students",
    onSubmit: handleSubmit,
    loading: loading,
    canSubmit: canSubmit,
    submitText: isEditMode ? "Update Exam" : "Assign Exam",
    loadingText: isEditMode ? "Updating..." : "Assigning...",
    showPDFReport: isEditMode,
    onPDFReportClick: handlePDFReportClick,
    pdfReportDisabled: examLoading
  };

  if (isEditMode && examLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading exam data...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isEditMode && examError) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load exam data</p>
            <button 
              onClick={() => loadExamData()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster closeButton />
      
      <ExamHeader {...headerProps} />
      
      <main className="flex-1 space-y-4 p-8 pt-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-background/90 backdrop-blur-sm transition-all duration-200 z-10 sticky top-34">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="basic" className="space-y-4">
              <BasicInfoTab
                basicInfo={basicInfo}
                setBasicInfo={setBasicInfo}
                collections={collections}
                collectionsLoading={collectionsLoading}
                collectionsError={collectionsError}
              />
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              <QuestionsTab 
                selectedCollection={basicInfo.selectedCollection}
              />
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <StudentsTab
                selectedStudents={selectedStudents}
                onStudentsChange={handleStudentsChange}
                students={students}
                loading={studentsLoading}
                error={studentsError}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <ExamSettingsTab
                examSettings={examSettings}
                setExamSettings={setExamSettings}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <PDFReportModal 
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
        examId={examId}
        selectedStudents={selectedStudents}
      />
      
      <Footer />
    </div>
  );
}

export default CreateExam;
