import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Edit, FileText, Clock, Users, AlertCircle, PlusCircle, Search, CalendarDays, XCircle } from 'lucide-react';
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import ExamAPI from './Exam.api';

const ErrorAlert = ({ error, dismissError }) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5" />
          <div>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={dismissError}
          className="-mt-1 -mr-2"
        >
          <XCircle className="h-5 w-5" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </Alert>
  );
};

const PageHeader = () => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
      <p className="mt-1 text-muted-foreground">
        Create and manage your exams.
      </p>
    </div>
  </div>
);

const SummaryCards = ({ loading, upcomingExams, exams, formatDate, formatDateTime, handleExamClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading ? (
        <>
          {[1, 2, 3].map((i) => (
            <Card key={`skeleton-${i}`} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </>
      ) : (
        <>
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
                <PlusCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                Create Exam
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-1">
                <p className="font-medium line-clamp-1">Create a new exam</p>
                <p className="text-sm text-muted-foreground">
                  Start building an assessment
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link to="/exams/new" className="w-full">
                <Button size="sm" className="w-full">
                  Create New Exam
                </Button>
              </Link>
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
                  Last update: {format(new Date(), "MMM d, yyyy")}
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
        </>
      )}
    </div>
  );
};

const ExamCalendar = ({ selectedDate, setSelectedDate, isDateHighlighted }) => (
  <Card className="col-span-full lg:col-span-1 border">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">Exam Calendar</CardTitle>
      <CardDescription>Select a date to view scheduled exams</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col items-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => setSelectedDate(date || selectedDate)}
          className="rounded-md border"
          modifiers={{ highlighted: isDateHighlighted }}
          modifiersStyles={{
            highlighted: {
              backgroundColor: "hsl(var(--primary) / 0.15)",
              fontWeight: "bold",
            },
            selected: {
              backgroundColor: "hsl(var(--primary) / 0.3)",
              color: "hsl(var(--primary-foreground))",
            },
            today: {
              backgroundColor: "hsl(210 20% 80% / 0.3)",
              color: "hsl(var(--primary-foreground))",
            },
          }}
        />
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-primary/30"></div>
            <span className="text-xs text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-primary"></div>
            <span className="text-xs text-muted-foreground">Has exams</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ExamsForSelectedDate = ({ selectedDate, searchQuery, setSearchQuery, listExams, formatDateTime, handleExamClick, getStatusBadge }) => (
  <Card className="col-span-full lg:col-span-1 border">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <CalendarDays className="mr-2 h-4 w-4" />
          {format(selectedDate, "MMMM d, yyyy")}
        </CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search exams</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Search Exams</h4>
              <Input
                placeholder="Enter exam title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <CardDescription>
        {listExams.length === 1
          ? "1 exam scheduled"
          : `${listExams.length} exams scheduled`}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[300px] pr-4">
        {listExams.length > 0 ? (
          <ul className="space-y-3">
            {listExams.map((exam) => (
              <li key={exam.id || `exam-${exam.title}-${new Date(exam.start_date).getTime()}`} className="relative">
                <button
                  onClick={() => handleExamClick(exam)}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted transition-colors flex flex-col"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium truncate">{exam.title}</h3>
                    {getStatusBadge(exam)}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3.5 w-3.5" />
                    <span>{formatDateTime(exam.start_date)}</span>
                    <span className="mx-1">-</span>
                    <span>{formatDateTime(exam.end_date)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div key="no-exams" className="flex flex-col items-center justify-center h-[200px] text-center p-4">
            <CalendarIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No exams scheduled for this day.</p>
          </div>
        )}
      </ScrollArea>
    </CardContent>
  </Card>
);

const RecentExamsTabs = ({ pastExams, ongoingExams, formatDate, formatDateTime, handleExamClick }) => (
  <Card className="col-span-full lg:col-span-1 border">
    <CardHeader className="pb-0">
      <CardTitle className="text-lg">Recent Exams</CardTitle>
    </CardHeader>
    <CardContent className="pt-2">
      <Tabs defaultValue="ended" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ended">Ended</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
        </TabsList>
        <TabsContent value="ended" className="mt-2">
          <ScrollArea className="h-[260px] pr-4">
            {pastExams.length > 0 ? (
              <ul className="space-y-3">
                {pastExams
                  .filter(e => {
                    const endDate = new Date(e.end_date);
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    return endDate >= oneYearAgo;
                  })
                  .slice(0, 6)
                  .map((exam) => (
                    <li key={exam.id || `past-exam-${exam.title}-${new Date(exam.end_date).getTime()}`} className="relative">
                      <button
                        onClick={() => handleExamClick(exam)}
                        className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium truncate">{exam.title}</h3>
                          <Badge variant="destructive">Ended</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ended: {formatDate(exam.end_date)}
                        </p>
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <div key="no-ended-exams" className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No ended exams yet.</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="ongoing" className="mt-2">
          <ScrollArea className="h-[260px] pr-4">
            {ongoingExams.length > 0 ? (
              <ul className="space-y-3">
                {ongoingExams.map((exam) => (
                  <li key={exam.id || `ongoing-exam-${exam.title}-${new Date(exam.end_date).getTime()}`} className="relative">
                    <button
                      onClick={() => handleExamClick(exam)}
                      className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium truncate">{exam.title}</h3>
                        <Badge className="bg-amber-500">Ongoing</Badge>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        <span>Ends: {formatDateTime(exam.end_date)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div key="no-ongoing-exams" className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No exams currently in progress.</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

const UpcomingExamsSection = ({ upcomingExams, searchQuery, setSearchQuery, handleExamClick, formatDate, getStatusBadge }) => {
  const nextExams = upcomingExams
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 3);

  const filteredExams = nextExams.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Upcoming Exams</CardTitle>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search upcoming exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-full sm:w-[220px]"
            />
          </div>
        </div>
        <CardDescription>View your next scheduled exams</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-4">
          {nextExams.length > 0 ? (
            <ul className="space-y-3">
              {filteredExams.map((exam) => (
                <li key={exam.id || `upcoming-exam-${exam.title}-${new Date(exam.start_date).getTime()}`} className="relative">
                  <div className="p-3 rounded-lg border bg-card hover:bg-muted transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      onClick={() => handleExamClick(exam)}
                      className="text-left flex-1"
                    >
                      <h3 className="font-medium">{exam.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{formatDate(exam.start_date)}</span>
                        <span>•</span>
                        <span>{exam.questions ? exam.questions.length : 0} questions</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <Badge>Upcoming</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div key="no-upcoming-exams" className="flex items-center justify-center h-[200px] text-center p-4">
              <CalendarIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No upcoming exams scheduled.</p>
            </div>
          )}
          {nextExams.length > 0 && filteredExams.length === 0 && (
            <div key="no-matching-exams" className="flex items-center justify-center h-[100px] text-center">
              <p className="text-muted-foreground">No matching upcoming exams found.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const ExamDetailsDialog = ({ dialogOpen, setDialogOpen, selectedExam, formatDate, formatDateTime, calculateDuration }) => {
  if (!selectedExam) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="bg-background text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{selectedExam.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Exam Details
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
                      <li key={`student-${student.id || index}`} className="text-sm flex items-center">
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
                <Link to={`/exams/${selectedExam.id}`} className="w-full sm:w-auto order-1 sm:order-2">
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
      </DialogContent>
    </Dialog>
  );
};

export default function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upcomingSearchQuery, setUpcomingSearchQuery] = useState('');

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const examData = await ExamAPI.fetchExams();
      setExams(examData);
      setError(null);
    } catch (err) {
      console.error('Failed to load exams:', err);
      setError('Failed to load exams. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const dismissError = () => {
    setError(null);
  };

  const now = new Date();

  const upcomingExams = exams.filter((e) =>
    new Date(e.start_date) > now
  );
  const ongoingExams = exams.filter((e) =>
    new Date(e.start_date) <= now && new Date(e.end_date) >= now
  );
  const pastExams = exams
    .filter((e) => new Date(e.end_date) < now)
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

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
    return format(d, "MMM d, yyyy");
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return format(d, "h:mm a");
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

  const isDateHighlighted = (date) => {
    return exams.some(exam => {
      const examDate = new Date(exam.start_date);
      return isSameDay(examDate, date);
    });
  };

  const getStatusBadge = (exam) => {
    if (now > new Date(exam.end_date)) {
      return <Badge variant="destructive">Ended</Badge>;
    } else if (new Date(exam.start_date) <= now && new Date(exam.end_date) >= now) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Ongoing</Badge>;
    } else {
      return <Badge>Upcoming</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
        <ErrorAlert error={error} dismissError={dismissError} />

        <PageHeader />

        <SummaryCards
          loading={loading}
          upcomingExams={upcomingExams}
          exams={exams}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          handleExamClick={handleExamClick}
        />

        {loading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ExamCalendar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isDateHighlighted={isDateHighlighted}
            />

            <ExamsForSelectedDate
              selectedDate={selectedDate}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              listExams={listExams}
              formatDateTime={formatDateTime}
              handleExamClick={handleExamClick}
              getStatusBadge={getStatusBadge}
            />

            <RecentExamsTabs
              pastExams={pastExams}
              ongoingExams={ongoingExams}
              formatDate={formatDate}
              formatDateTime={formatDateTime}
              handleExamClick={handleExamClick}
            />
          </div>
        )}

        {!loading && (
          <UpcomingExamsSection
            upcomingExams={upcomingExams}
            searchQuery={upcomingSearchQuery}
            setSearchQuery={setUpcomingSearchQuery}
            handleExamClick={handleExamClick}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
        )}

        <ExamDetailsDialog
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          selectedExam={selectedExam}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          calculateDuration={calculateDuration}
        />
      </main>
      <Footer />
    </div>
  );
}