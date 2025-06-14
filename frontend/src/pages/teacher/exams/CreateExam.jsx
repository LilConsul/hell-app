import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentsTab } from "@/components/exams/teacher/tabs/students";
import { BasicInfoTab } from "@/components/exams/teacher/tabs/basic-info";
import { QuestionsTab } from "@/components/exams/teacher/tabs/questions/tab";
import { ExamSettingsTab } from "@/components/exams/teacher/tabs/exam-settings";
import { ExamHeader } from "@/components/exams/teacher/page-header";
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
  
  // Centralized basic info state
  const [basicInfo, setBasicInfo] = useState({
    examTitle: "",
    selectedCollection: preselectedCollectionId || "",
    startDate: "",
    duration: "120", // in minutes
    maxAttempts: 1,
    passingScore: 60
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Centralized exam settings state
  const [examSettings, setExamSettings] = useState({
    security_settings: {
      shuffle_questions: false,
      allow_review: true,
      prevent_tab_switching: false,
      tab_switch_limit: 0,
      gaze_tracking: false,
      gaze_limit: 0
    },
    notification_settings: {
      reminder_enabled: true,
      reminders: ["2d", "1h", "20m"]
    }
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
 
  const loadExamData = async () => {
    try {
      setExamLoading(true);
      setExamError(null);
      const response = await examAPI.getExam(examId);
      const examData = response.data;
      
      setBasicInfo({
        examTitle: examData.title,
        selectedCollection: examData.collection_id,
        startDate: utcToLocalDateTimeString(examData.start_date),
        duration: Math.round((new Date(examData.end_date) - new Date(examData.start_date)) / 60000).toString(),
        maxAttempts: examData.max_attempts,
        passingScore: examData.passing_score
      });
      
      const assignedStudentIds = examData.assigned_students?.map(s => 
        typeof s === 'object' ? s.student_id : s
      ) || [];
      
      if (students.length > 0) {
        const assignedStudents = students.filter(student => 
          assignedStudentIds.includes(student.id)
        );
        setSelectedStudents(assignedStudents);
      } else {
        setPendingStudentIds(assignedStudentIds);
      }
      
      setExamSettings({
        security_settings: {
          shuffle_questions: examData.security_settings.shuffle_questions,
          allow_review: examData.security_settings.allow_review,
          prevent_tab_switching: examData.security_settings.prevent_tab_switching,
          tab_switch_limit: examData.security_settings.tab_switch_limit || 0,
          gaze_tracking: examData.security_settings.gaze_tracking,
          gaze_limit: examData.security_settings.gaze_limit || 0
        },
        notification_settings: {
          reminder_enabled: examData.notification_settings.reminder_enabled,
          reminders: examData.notification_settings.reminders
        }
      });
      
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
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
      
      let result;
      if (isEditMode) {
        result = await examAPI.updateExam(examId, examData);
        toast.success("Exam updated successfully!", {
          description: `${basicInfo.examTitle} has been updated.`
        });
      } else {
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

  // Check if form can be submitted
  const canSubmit = basicInfo.examTitle.trim() && 
    basicInfo.selectedCollection && 
    basicInfo.startDate && 
    basicInfo.duration && 
    parseInt(basicInfo.duration) >= 5 && 
    selectedStudents.length > 0;

  // Header props based on mode
  const headerProps = {
    title: isEditMode ? "Edit Exam" : "Assign New Exam",
    subtitle: isEditMode ? "Update exam details and settings" : "Create and assign an exam to students",
    onSubmit: handleSubmit,
    loading: loading,
    canSubmit: canSubmit,
    submitText: isEditMode ? "Update Exam" : "Assign Exam",
    loadingText: isEditMode ? "Updating..." : "Assigning..."
  };

  // Loading state while fetching exam data
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

  // Error state if failed to load exam data
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
      <Footer />
    </div>
  );
}

export default CreateExam;