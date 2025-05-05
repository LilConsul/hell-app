import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  BookOpenCheck,
  CalendarClock,
  CalendarCheck,
  FileCheck2,
  BarChart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/lib/utils";

const fetchStats = async () => {
  const collectionsData = await apiRequest(
    "/api/v1/exam/teacher/collections/"
  );
  const examsData = await apiRequest(
    "/api/v1/exam/teacher/exam-instances/",
    { credentials: "include" }
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

export function TeacherDashboard() {
  const [stats, setStats] = useState({
    recentCollections: [],
    upcomingExams: [],
    recentlyEndedExams: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 p-10 max-w-7xl mx-auto space-y-15">
        <div className="bg-muted/10 border rounded-xl p-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to the administration platform, teacher!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <Link
            to="/collections"
            className="bg-card rounded-2xl p-6 shadow hover:shadow-lg transition-all border flex flex-col items-start justify-between min-h-[180px]"
          >
            <BookOpenCheck className="h-8 w-8 text-primary mb-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1">Question Collections</h2>
              <p className="text-muted-foreground text-sm ">
                Create, edit, and manage question collections.
              </p>
            </div>
          </Link>

          <Link
            to="/exams"
            className="bg-card rounded-2xl p-6 shadow hover:shadow-lg transition-all border flex flex-col items-start justify-between min-h-[180px]"
          >
            <FileCheck2 className="h-8 w-8 text-primary mb-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1">Exams</h2>
              <p className="text-muted-foreground text-sm">
                Schedule and manage exams for students.
              </p>
            </div>
          </Link>

          <Link
            to="/reports"
            className="bg-card rounded-2xl p-6 shadow hover:shadow-lg transition-all border flex flex-col items-start justify-between min-h-[180px]"
          >
            <BarChart className="h-8 w-8 text-primary mb-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1">Reports & Statistics</h2>
              <p className="text-muted-foreground text-sm">
                View exam performance and export PDF reports.
              </p>
            </div>
          </Link>
        </div>

        <div className="bg-muted/10 border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpenCheck className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Added Collections</h4>
              </div>
              {loading ? (
                <p className="text-muted-foreground italic">Loading...</p>
              ) : stats.recentCollections.length === 0 ? (
                <p className="text-muted-foreground">No recent collections available.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentCollections.map((col) => {
                    const count = Array.isArray(col.questions)
                      ? col.questions.length
                      : col.question_count ?? 0;
                    return (
                      <li
                        key={col._id || col.id}
                        className="flex items-center justify-between border rounded-md p-2 bg-background"
                      >
                        <div className="flexitems-center gap-2 truncate">
                          <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{col.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {count} {count === 1 ? 'question' : 'questions'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="md:border-l md:border-gray-200 md:pl-6">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Upcoming Exams</h4>
              </div>
              {loading ? (
                <p className="text-muted-foreground italic">Loading...</p>
              ) : stats.upcomingExams.length === 0 ? (
                <p className="text-muted-foreground">No upcoming exams scheduled.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.upcomingExams.map((exam) => (
                    <li
                      key={exam._id}
                      className="flex flex-col border rounded-md p-2 bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mediumtruncate">{exam.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {new Date(exam.start_date).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="md:border-l md:border-gray-200 md:pl-6">
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Ended Exams</h4>
              </div>
              {loading ? (
                <p className="text-muted-foreground italic">Loading...</p>
              ) : stats.recentlyEndedExams.length === 0 ? (
                <p className="text-muted-foreground">No exams have ended recently.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentlyEndedExams.map((exam) => (
                    <li
                      key={exam._id}
                      className="flex flex-col border rounded-md p-2 bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mediumtruncate">{exam.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {new Date(exam.end_date).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}