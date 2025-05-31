import { BookOpen, AlertTriangle } from "lucide-react";

export function ExamsHeader({ exams = [] }) {
  const overdueCount = exams.filter(exam => {
    const now = new Date();
    const endDate = new Date(exam.exam_instance_id?.end_date);
    return endDate < now && exam.current_status !== "completed";
  }).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Main Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Exams</h1>
              <p className="text-muted-foreground">
                Manage and take your assigned examinations
              </p>
            </div>
          </div>
          
          {/* Overdue Alert */}
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                You have {overdueCount} overdue exam{overdueCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}