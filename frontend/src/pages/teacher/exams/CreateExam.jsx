import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { StudentsTab } from "@/components/exams/tabs/students";
import { BasicInfoTab } from "@/components/exams/tabs/basic-info";
import { QuestionsTab } from "@/components/exams/tabs/questions/tab";
import { ExamSettingsTab } from "@/components/exams/tabs/exam-settings";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import examAPI from "./Exam.api";
import collectionAPI from "@/pages/teacher/collections/Collections.api";

function CreateExam() {
  const navigate = useNavigate();
  
  // Centralized basic info state
  const [basicInfo, setBasicInfo] = useState({
    examTitle: "",
    selectedCollection: "",
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

  // Loading states
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  
  // Data state
  const [collections, setCollections] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Error states
  const [studentsError, setStudentsError] = useState(null);
  const [collectionsError, setCollectionsError] = useState(null);

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Load collections on component mount
  useEffect(() => {
    loadCollections();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const startDate = new Date(basicInfo.startDate).toISOString();
      const endDate = calculateEndDate(basicInfo.startDate, parseInt(basicInfo.duration));

      const examData = {
        title: basicInfo.examTitle,
        start_date: startDate,
        end_date: endDate,
        max_attempts: basicInfo.maxAttempts,
        passing_score: basicInfo.passingScore,
        security_settings: examSettings.security_settings,
        notification_settings: examSettings.notification_settings,
        collection_id: basicInfo.selectedCollection,
        assigned_students: selectedStudents.map(student => ({
          student_id: student.id
        }))
      };
      
      console.log("Creating exam:", examData);
      
      const result = await examAPI.createExam(examData);
      
      toast.success("Exam assigned successfully!", {
        description: `${basicInfo.examTitle} has been assigned to ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}.`
      });
      
      navigate("/exams");
      
    } catch (error) {
      console.error("Failed to create exam:", error);
      toast.error("Failed to assign exam", {
        description: error.message || "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster closeButton />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between space-y-2 mb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Assign New Exam</h2>
              <p className="text-muted-foreground">Create and assign an exam to students</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/exams')}>
              Back to Exams
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

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

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/exams')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Exam"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CreateExam;