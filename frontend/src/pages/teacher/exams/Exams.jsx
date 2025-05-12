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
import { Calendar, Edit, FileText, Clock, Users, AlertCircle, PlusCircle } from 'lucide-react';

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
      <main className="flex-1 w-full px-6 md:px-60 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Exam Management</h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage your exams.
            </p>
          </div>
          <Button asChild size="lg" className="h-10">
            <Link to="/create-exams">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Exam
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border shadow-sm overflow-hidden h-full flex flex-col">
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

          <Card className="border shadow-sm overflow-hidden h-full flex flex-col">
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

          <Card className="border shadow-sm overflow-hidden h-full flex flex-col">
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
          <p className="text-muted-foreground">Loading exams…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Card spans 1 column */}
            <Card className="lg:col-span-1 border shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center text-lg px-5">
                  <div>Exam Calendar</div>
                </CardTitle>
                <div className="flex flex-wrap gap-2 px-4.5">
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
              <CardContent className="pt-0">
                <style>
                  {`
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
                  `}
                </style>
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
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  Exams on {formatDate(selectedDate)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-3">
                    {listExams.map((e) => (
                      <li key={e.id} className="p-3 bg-card hover:bg-muted rounded-lg border">
                        <button 
                          onClick={() => handleExamClick(e)}
                          className="w-full text-left"
                        > 
                          <div className="flex justify-between items-center">
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
                    {listExams.length === 0 && <p className="text-muted-foreground">No exams found for this day.</p>}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-1 border shadow-sm">
              <CardHeader className="pb-2">
                 <CardTitle className="flex items-center text-lg">
                  Recently Ended Exams
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-3">
                    {pastExams
                      .filter(e => {
                        const endDate = new Date(e.end_date);
                        const oneYearAgo = new Date();
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                        return endDate >= oneYearAgo;
                      })
                      .map((e) => (
                      <li key={e.id} className="p-3 bg-card hover:bg-muted rounded-lg border">
                        <button 
                          onClick={() => handleExamClick(e)}
                          className="w-full text-left"
                        > 
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{e.title}</p>
                              <p className="text-sm text-muted-foreground">Ended: {formatDate(e.end_date)}</p>
                            </div>
                            <Badge variant="destructive">Ended</Badge>
                          </div>
                        </button>
                      </li>
                    ))}
                    {pastExams.length === 0 && <p className="text-muted-foreground">No ended exams yet.</p>}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && draftExams.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Draft Exams</CardTitle>
              <div className="mt-2">
                <Input
                  placeholder="Search draft exams..."
                  value={draftSearchQuery}
                  onChange={(e) => setDraftSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {draftExams
                  .filter(e => e.title.toLowerCase().includes(draftSearchQuery.toLowerCase().trim()))
                  .sort((a, b) => new Date(b.start_date) - new Date(a.start_date)) // Most recent first
                  .map((e) => (
                    <li key={e.id} className="flex flex-wrap justify-between items-center p-3 hover:bg-muted rounded border">
                      <button 
                        onClick={() => handleExamClick(e)}
                        className="w-full h-full flex flex-wrap justify-between items-center"
                      >
                        <div className="w-full sm:w-auto mb-1 sm:mb-0">
                          <span className="font-medium text-left hover:text-primary block">
                            {e.title}
                          </span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{formatDate(e.start_date)}</span>
                            <span>{formatDateTime(e.start_date)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm bg-background text-foreground px-2 py-1 rounded border">
                            {e.questions ? e.questions.length : 0} questions
                          </span>
                          <Badge variant="outline">Draft</Badge>
                        </div>
                      </button>
                    </li>
                  ))}
                {draftExams.length === 0 && <p className="text-muted-foreground">No draft exams available.</p>}
              </ul>
            </CardContent>
          </Card>
        )}

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
                
                <DialogFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Close
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to={`/exam/${selectedExam.id}`}>
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
      </main>
      <Footer />
    </div>
  );
}

