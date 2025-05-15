import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { apiRequest } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, Edit, FileText, Clock, Users, AlertCircle, PlusCircle, Search } from 'lucide-react';

export default function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');

  useEffect(() => {
    apiRequest('/api/v1/exam/teacher/exam-instances/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setExams(data);
      })
      .catch(() => setError('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date || selectedDate);
  };

  const now = new Date();

  const publishedExams = exams.filter((e) => e.status === 'published');
  const draftExams = exams.filter((e) => e.status === 'draft');

  const upcomingExams = publishedExams.filter((e) =>
    new Date(e.start_date) > now
  );
  const ongoingExams = publishedExams.filter((e) =>
    new Date(e.start_date) <= now && new Date(e.end_date) >= now
  );
  const pastExams = publishedExams
    .filter((e) => new Date(e.end_date) < now)
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

  const upcomingDates = upcomingExams.map((e) => new Date(e.start_date));
  const ongoingDates = ongoingExams.map((e) => new Date(e.start_date));
  const pastDates = pastExams.map((e) => new Date(e.end_date));

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  const listExams = exams
    .filter((e) => {
      const start = new Date(e.start_date);
      return isSameDay(start, selectedDate);
    })
    .filter((e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

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

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-20 sm:px-20 lg:px-40 py-8 space-y-6">
        {/* Page header with responsive layout */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage your exams.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/create-exams">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Exam
            </Link>
          </Button>
        </div>

        {/* Summary cards with responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                Next Exam
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {upcomingExams.length > 0 ? (
                <div className="flex flex-col h-full justify-between space-y-2">
                  <div className="space-y-1">
                    <p className="font-medium line-clamp-1">{upcomingExams[0].title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(upcomingExams[0].start_date)}, {formatDateTime(upcomingExams[0].start_date)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming exams</p>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              {upcomingExams.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleExamClick(upcomingExams[0])}
                >
                  View Details
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled
                >
                  View Details
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Edit className="mr-2 h-5 w-5 text-muted-foreground" />
                Recent Draft
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {draftExams.length > 0 ? (
                <div className="space-y-1">
                  <p className="font-medium line-clamp-1">{draftExams[0].title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {draftExams[0].questions ? draftExams[0].questions.length : 0} questions
                    </Badge>
                    <p className="text-l">
                      Last edited: {new Date(draftExams[0].updated_at || draftExams[0].created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No draft exams</p>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              {draftExams.length > 0 ? (
                <Link to={`/exam/${draftExams[0].id}/edit`} className="w-full">
                  <Button size="sm" className="w-full">
                    Continue Editing
                  </Button>
                </Link>
              ) : (
                <Link to="/exam/create" className="w-full">
                  <Button size="sm" variant="outline" className="w-full">
                    Create New Exam
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                Total Exams
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-col space-y-1">
                <p className="font-medium">Total: {exams.length} exams</p>
                <p className="text-sm text-muted-foreground">
                  Last update: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link to="/all-exams" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  View All
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <p className="text-muted-foreground">Loading exams…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
<Card className="col-span-full lg:col-span-1 border overflow-hidden">
  <CardHeader className="pb-0">
    <CardTitle className="text-lg text-center">Exam Calendar</CardTitle>
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0">
        <span className="mr-1 text-emerald-500">●</span> Upcoming
      </Badge>
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">
        <span className="mr-1 text-amber-500">●</span> Today
      </Badge>
      <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-0">
        <span className="mr-1 text-rose-500">●</span> Past
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <style>
      {`
        /* Base calendar container styles */
        .calendar-container {
          max-width: 100%;
          overflow-x: auto;
        }

        /* DayPicker responsive styles */
        .rdp {
          --rdp-cell-size: clamp(30px, 4vw, 40px);
          --rdp-caption-font-size: 16px;
          font-size: clamp(14px, 2vw, 16px);
        }

        .rdp-months {
          justify-content: center;
        }

        .rdp-month {
          max-width: 100%;
        }

        .rdp-table {
          max-width: 100%;
        }

        .rdp-cell {
          padding: 0;
        }

        .rdp-head_cell {
          font-size: clamp(12px, 1.8vw, 14px);
          padding: 0;
        }

        .rdp-day {
          min-width: var(--rdp-cell-size);
          max-width: var(--rdp-cell-size);
          height: var(--rdp-cell-size);
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rdp-day_selected:not(.rdp-day_disabled):not(.rdp-day_outside) {
          background-color: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
          font-weight: bold;
        }
        
        .rdp-day_upcoming:not(.rdp-day_disabled):not(.rdp-day_outside) {
          background-color: rgba(16, 185, 129, 0.15);
          color: hsl(var(--foreground));
          font-weight: 500;
        }
        
        .rdp-day_ongoing:not(.rdp-day_disabled):not(.rdp-day_outside) {
          background-color: rgba(245, 158, 11, 0.15);
          color: hsl(var(--foreground));
          font-weight: 500;
        }
        
        .rdp-day_past:not(.rdp-day_disabled):not(.rdp-day_outside) {
          background-color: rgba(239, 68, 68, 0.15);
          color: hsl(var(--foreground));
          font-weight: 500;
        }
        
        /* Combined states for selected + upcoming/ongoing/past */
        .rdp-day_selected.rdp-day_upcoming:not(.rdp-day_disabled):not(.rdp-day_outside) {
          background-color: rgba(16, 185, 129, 0.3);
          color: hsl(var(--foreground));
          font-weight: bold;
        }
        
        .rdp-day_selected.rdp-day_ongoing:not(.rdp-day_disabled):not(.rdp-day_outside) {
          background-color: rgba(245, 158, 11, 0.3);
          color: hsl(var(--foreground));
          font-weight: bold;
        }
        
        .rdp-day_selected.rdp-day_past:not(.rdp-day_disabled):not(.rdp-day_outside) {
          background-color: rgba(239, 68, 68, 0.3);
          color: hsl(var(--foreground));
          font-weight: bold;
        }
        
        @media (prefers-color-scheme: dark) {
          .rdp-day_upcoming:not(.rdp-day_disabled):not(.rdp-day_outside) {
            background-color: rgba(16, 185, 129, 0.2);
            color: hsl(var(--foreground));
          }
          
          .rdp-day_ongoing:not(.rdp-day_disabled):not(.rdp-day_outside) {
            background-color: rgba(245, 158, 11, 0.2);
            color: hsl(var(--foreground));
          }
          
          .rdp-day_past:not(.rdp-day_disabled):not(.rdp-day_outside) {
            background-color: rgba(239, 68, 68, 0.2);
            color: hsl(var(--foreground));
          }
          
          .rdp-day_selected:not(.rdp-day_disabled):not(.rdp-day_outside) {
            background-color: hsl(var(--muted));
            color: hsl(var(--muted-foreground));
          }
          
          .rdp-day_selected.rdp-day_upcoming:not(.rdp-day_disabled):not(.rdp-day_outside) {
            background-color: rgba(16, 185, 129, 0.35);
            color: hsl(var(--foreground));
          }
          
          .rdp-day_selected.rdp-day_ongoing:not(.rdp-day_disabled):not(.rdp-day_outside) {
            background-color: rgba(245, 158, 11, 0.35);
            color: hsl(var(--foreground));
          }
          
          .rdp-day_selected.rdp-day_past:not(.rdp-day_disabled):not(.rdp-day_outside) {
            background-color: rgba(239, 68, 68, 0.35);
            color: hsl(var(--foreground));
          }
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .rdp {
            --rdp-cell-size: clamp(28px, 8vw, 36px);
            margin: 0 auto;
          }
          
          .rdp-head_cell {
            font-size: 12px;
          }
        }
      `}
    </style>
    <div className="calendar-container">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        modifiers={{
          upcoming: upcomingDates,
          ongoing: ongoingDates,
          past: pastDates,
        }}
        modifiersClassNames={{
          upcoming: 'rdp-day_upcoming',
          ongoing: 'rdp-day_ongoing',
          past: 'rdp-day_past',
        }}
      />
    </div>
  </CardContent>
</Card>

            {/* Exams for Selected Date */}
            <Card className="col-span-full lg:col-span-1 border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Exams on {formatDate(selectedDate)}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <ul className="space-y-3">
                    {listExams.map((e) => (
                      <li key={e.id} className="p-3 bg-card hover:bg-muted rounded-lg border transition-colors">
                        <button
                          onClick={() => handleExamClick(e)}
                          className="w-full text-left"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                              <p className="font-semibold">{e.title}</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(e.start_date)}</p>
                            </div>
                            {e.status === 'draft' ? (
                              <Badge variant="secondary">Draft</Badge>
                            ) : now > new Date(e.end_date) ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : new Date(e.start_date) <= now && new Date(e.end_date) >= now ? (
                              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Ongoing</Badge>
                            ) : (
                              <Badge variant="default">Upcoming</Badge>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                    {listExams.length === 0 &&
                      <div className="flex items-center justify-center h-[200px] text-center">
                        <p className="text-muted-foreground">No exams scheduled for this day.</p>
                      </div>
                    }
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recently Ended Exams */}
            <Card className="col-span-full lg:col-span-1 border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recently Ended Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <ul className="space-y-3">
                    {pastExams
                      .filter(e => {
                        const endDate = new Date(e.end_date);
                        const oneYearAgo = new Date();
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                        return endDate >= oneYearAgo;
                      })
                      .map((e) => (
                        <li key={e.id} className="p-3 bg-card hover:bg-muted rounded-lg border transition-colors">
                          <button
                            onClick={() => handleExamClick(e)}
                            className="w-full text-left"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                              <div>
                                <p className="font-semibold">{e.title}</p>
                                <p className="text-sm text-muted-foreground">Ended: {formatDate(e.end_date)}</p>
                              </div>
                              <Badge variant="destructive">Ended</Badge>
                            </div>
                          </button>
                        </li>
                      ))}
                    {pastExams.length === 0 &&
                      <div className="flex items-center justify-center h-[200px] text-center">
                        <p className="text-muted-foreground">No ended exams yet.</p>
                      </div>
                    }
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Draft Exams Section */}
        {!loading && draftExams.length > 0 && (
          <Card className="border">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
              <CardTitle>Draft Exams</CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drafts..."
                  value={draftSearchQuery}
                  onChange={(e) => setDraftSearchQuery(e.target.value)}
                  className="pl-8 h-9 w-full sm:w-[220px]"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {draftExams
                  .filter(e => e.title.toLowerCase().includes(draftSearchQuery.toLowerCase().trim()))
                  .sort((a, b) => new Date(b.start_date) - new Date(a.start_date)) // Most recent first
                  .map((e) => (
                    <li key={e.id} className="p-3 hover:bg-muted rounded border transition-colors">
                      <button
                        onClick={() => handleExamClick(e)}
                        className="w-full h-full"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="text-left">
                            <span className="font-medium block hover:text-primary">
                              {e.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span>{formatDate(e.start_date)}</span>
                              <span>{formatDateTime(e.start_date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 sm:mt-0">
                            <span className="text-sm bg-background text-foreground px-2 py-1 rounded border">
                              {e.questions ? e.questions.length : 0} questions
                            </span>
                            <Badge variant="outline">Draft</Badge>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                {draftExams.length === 0 &&
                  <div className="flex items-center justify-center h-[100px] text-center">
                    <p className="text-muted-foreground">No draft exams available.</p>
                  </div>
                }
              </ul>
            </CardContent>
          </Card>
        )}

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Ongoing</Badge>
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

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between border-t pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">
                    Close
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to={`/exam/${selectedExam.id}`} className="w-full sm:w-auto order-1 sm:order-2">
                          <Button className="w-full">
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
      </main>
      <Footer />
    </div>
  );
}