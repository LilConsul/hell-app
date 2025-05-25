import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BookOpenCheck,
  FileCheck2,
  FileText,
  BarChart,
  CalendarClock, 
  CalendarCheck,
  Calendar,
  Edit,
  Clock,
  Users,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fetchStats = async () => {
  const collectionsData = await apiRequest(
    "/api/v1/exam/teacher/collections/"
  );
  const examsData = await apiRequest(
    "/api/v1/exam/teacher/exam-instances/",
  );

  const collections = collectionsData?.data || [];
  const exams = examsData?.data || [];
  const activeExams = exams.filter((e) => e.status === "published");

  const reportPromises = activeExams.map((exam) =>
    exam._id
      ? apiRequest(
          `/api/v1/exam/teacher/report/${exam._id}`,
          { credentials: "include" }
        ).catch(() => null)
      : Promise.resolve(null)
  );
  const reports = await Promise.all(reportPromises);
  const reportsCount = reports.filter((r) => r !== null).length;

  const passRates = reports
    .filter((r) => r && typeof r?.data?.pass_rate === "number")
    .map((r) => r.data.pass_rate);

  const passRateAverage =
    passRates.length > 0
      ? Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length)
      : null;

  const totalQuestions = collections.reduce((sum, col) => {
    const count = Array.isArray(col.questions)
      ? col.questions.length
      : col.question_count ?? 0;
    return sum + count;
  }, 0);

  const recentCollections = [...collections]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  const now = new Date();

  const upcomingExams = activeExams
    .filter((e) => new Date(e.start_date) > now)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 3);

  const recentlyEndedExams = activeExams
    .filter((e) => new Date(e.end_date) < now)
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
    .slice(0, 3);

  return {
    collectionsCount: collections.length,
    examsCount: activeExams.length,
    reportsCount,
    totalQuestions,
    passRate: passRateAverage,
    recentCollections,
    upcomingExams,
    recentlyEndedExams,
  };
};

function TeacherDashboard() {
  const [stats, setStats] = useState({
    recentCollections: [],
    upcomingExams: [],
    recentlyEndedExams: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setDialogOpen(true);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { dateStyle: 'medium' });
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const now = new Date();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 p-10 max-w-7xl mx-auto space-y-15">
        <div className="bg-muted/10 border rounded-xl p-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-xl">
            Welcome to the administration platform, teacher!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/collections">
            <Card className="bg-card rounded-2xl shadow hover:shadow-lg transition-all p-4 flex flex-col items-start gap-10 h-full">
              <BookOpenCheck className="h-8 w-8 text-primary mt-2" />
              <div>
                <CardTitle className="text-xl font-semibold">Question Collections</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create, edit, and manage question collections.
                </p>
              </div>
            </Card>
          </Link>

          <Link to="/exams">
            <Card className="bg-card rounded-2xl shadow hover:shadow-lg transition-all p-4 flex flex-col items-start gap-10 h-full">
              <FileCheck2 className="h-8 w-8 text-primary mt-2"  />
              <div>
                <CardTitle className="text-xl font-semibold">Exams</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Schedule and manage exams for students.
                </p>
              </div>
            </Card>
          </Link>

          <Link to="/reports">
            <Card className="bg-card rounded-2xl shadow hover:shadow-lg transition-all p-4 flex flex-col items-start gap-10 h-full">
              <BarChart className="h-8 w-8 text-primary mt-2" />
              <div>
                <CardTitle className="text-xl font-semibold">Reports & Statistics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View exam performance and export PDF reports.
                </p>
              </div>
            </Card>
          </Link>
        </div>

        <div className="bg-muted/10 border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {/* --- Added Collections --- */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpenCheck className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Added Collections</h4>
              </div>
              {loading ? (
                <p className="text-muted-foreground italic">Loading...</p>
              ) : stats.recentCollections.length === 0 ? (
                <p className="text-muted-foreground">
                  No recent collections available.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentCollections.map((col) => {
                    const count = Array.isArray(col.questions)
                      ? col.questions.length
                      : col.question_count ?? 0;
                    const id = col._id || col.id;
                    return (
                      <Link
                        key={id}
                        to={`/collections/${id}`}
                        className="flex flex-col border rounded-md p-2 bg-background hover:bg-muted/20 transition"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">
                            {col.title}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate ml-6">
                          {count} {count === 1 ? "Question" : "Questions"}
                        </span>
                      </Link>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* --- Upcoming Exams --- */}
            <div className="md:border-l md:border-gray-200 md:pl-6">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Upcoming Exams</h4>
              </div>
              {loading ? (
                <p className="text-muted-foreground italic">Loading...</p>
              ) : stats.upcomingExams.length === 0 ? (
                <p className="text-muted-foreground">
                  No upcoming exams scheduled.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.upcomingExams.map((exam) => {
                    const date = new Date(exam.start_date);
                    const formattedDate = date.toLocaleDateString();
                    const formattedTime = date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <button
                        key={exam._id}
                        onClick={() => handleExamClick(exam)}
                        className="flex flex-col border rounded-md p-2 bg-background hover:bg-muted/20 transition w-full text-left"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarClock
                            className="h-4 w-4 text-muted-foreground"
                          />
                          <span className="font-medium truncate">
                            {exam.title}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate ml-6">
                          {formattedDate}, {formattedTime}
                        </span>
                      </button>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* --- Ended Exams --- */}
            <div className="md:border-l md:border-gray-200 md:pl-6">
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Ended Exams</h4>
              </div>
              {loading ? (
                <p className="text-muted-foreground italic">Loading...</p>
              ) : stats.recentlyEndedExams.length === 0 ? (
                <p className="text-muted-foreground">
                  No exams have ended recently.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentlyEndedExams.map((exam) => {
                    const date = new Date(exam.end_date);
                    const formattedDate = date.toLocaleDateString();
                    const formattedTime = date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <button
                        key={exam._id}
                        onClick={() => handleExamClick(exam)}
                        className="flex flex-col border rounded-md p-2 bg-background hover:bg-muted/20 transition w-full text-left"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarCheck
                            className="h-4 w-4 text-muted-foreground"
                          />
                          <span className="font-medium truncate">
                            {exam.title}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate ml-6">
                          {formattedDate}, {formattedTime}
                        </span>
                      </button>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Exam Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background text-foreground max-w-md">
          {selectedExam && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedExam.title}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {selectedExam.status === 'draft' ? 'Draft Exam' : 'Published Exam'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        <h3 className="font-medium">Start Date</h3>
                      </div>
                      <p>{formatDate(selectedExam.start_date)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <h3 className="font-medium">Start Time</h3>
                      </div>
                      <p>{formatDateTime(selectedExam.start_date)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <h3 className="font-medium">Duration</h3>
                      </div>
                      <p>{calculateDuration(selectedExam.start_date, selectedExam.end_date)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        <h3 className="font-medium">Status</h3>
                      </div>
                      <p>
                        {selectedExam.status === 'draft' ? (
                          <Badge variant="secondary">Draft</Badge>
                        ) : now > new Date(selectedExam.end_date) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : new Date(selectedExam.start_date) <= now && new Date(selectedExam.end_date) >= now ? (
                          <Badge variant="warning">Ongoing</Badge>
                        ) : (
                          <Badge variant="default">Upcoming</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <h3 className="font-medium">Assigned Students</h3>
                    </div>
                    {selectedExam.assigned_students && selectedExam.assigned_students.length > 0 ? (
                      <ScrollArea className="h-[120px] border rounded-md p-2">
                        <ul className="space-y-1">
                          {selectedExam.assigned_students.map((student, index) => (
                            <li key={index} className="text-sm flex items-center">
                              <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                              {student.name || student.email || `Student ${index + 1}`}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/10">
                        No students assigned yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={`/exam/${selectedExam.id || selectedExam._id}`}>
                        <Button>
                          <FileText className="mr-2 h-4 w-4" /> View Details
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View full exam details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default TeacherDashboard;
