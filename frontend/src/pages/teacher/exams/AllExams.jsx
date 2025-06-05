import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCaption, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious
} from '@/components/ui/pagination';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { usePagination } from '@/hooks/use-pagination'; 
import ExamAPI from './Exam.api'; 
import { Link } from 'react-router-dom';
import {
  Search, ArrowUpDown, AlertCircle, FileText,
  BarChart, PlusCircle, Calendar, Clock, Users, Edit
} from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
    <Input
      placeholder="Search exams by title..."
      className="pl-10"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>
);

const SortDropdown = ({ sortBy, setSortBy, sortDirection, setSortDirection }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="w-full justify-between">
        <div className="flex items-center">
          <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Sort by: {sortBy.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56">
      <DropdownMenuItem onClick={() => setSortBy('title')}>
        Title
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setSortBy('start_date')}>
        Start Date
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setSortBy('end_date')}>
        End Date
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setSortBy('updated_at')}>
        Last Updated
      </DropdownMenuItem>

      <Separator className="my-2" />

      <div className="px-2 py-1.5 text-sm font-semibold">Sort Direction</div>
      <DropdownMenuItem onClick={() => setSortDirection('asc')} className="gap-2">
        <div className={`${sortDirection === 'asc' ? 'opacity-100' : 'opacity-0'} transition-opacity`}>✓</div>
        Sort Ascending
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setSortDirection('desc')} className="gap-2">
        <div className={`${sortDirection === 'desc' ? 'opacity-100' : 'opacity-0'} transition-opacity`}>✓</div>
        Sort Descending
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const ExamRow = ({ exam, onExamClick }) => {
  const now = new Date();

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

  return (
    <TableRow
      onClick={() => onExamClick(exam)}
      className="hover:bg-muted/50 cursor-pointer"
    >
      <TableCell className="font-medium">{exam.title}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{formatDate(exam.start_date)}</span>
          <span className="text-xs text-muted-foreground">{formatDateTime(exam.start_date)}</span>
        </div>
      </TableCell>
      <TableCell>{calculateDuration(exam.start_date, exam.end_date)}</TableCell>
      <TableCell>
        {exam.assigned_students ? exam.assigned_students.length : 0} students
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/exams/${exam.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit exam</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/exams/${exam.id}/report`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon">
                    <BarChart className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Report</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
};

const ExamsTable = ({ exams, onExamClick }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Students</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exams.length > 0 ? (
          exams.map((exam, index) => (
            <ExamRow
              key={exam.id || `exam-${exam.title}-${new Date(exam.start_date).getTime()}-${index}`}
              exam={exam}
              onExamClick={onExamClick}
            />
          ))
        ) : (
          <TableRow key="no-exams-row">
            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
              No exams match your search criteria.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

const ExamDetailDialog = ({ open, onOpenChange, exam }) => {
  if (!exam) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{exam.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Exam Details
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
                <p>{formatDate(exam.start_date)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  <h3 className="font-medium">Start Time</h3>
                </div>
                <p>{formatDateTime(exam.start_date)}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                <h3 className="font-medium">Duration</h3>
              </div>
              <p>{calculateDuration(exam.start_date, exam.end_date)}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                <h3 className="font-medium">Assigned Students</h3>
              </div>
              {exam.assigned_students && exam.assigned_students.length > 0 ? (
                <div className="max-h-[120px] overflow-y-auto border rounded-md p-2">
                  <ul className="space-y-1">
                    {exam.assigned_students.map((student) => (
                      <li key={student.id || `student-${student.email}`} className="text-sm flex items-center">
                        <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                        {student.name || student.email || 'Unnamed Student'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/10">
                  No students assigned yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex space-x-2">
            <Link to={`/exams/${exam.id}`}>
              <Button>
                <FileText className="mr-2 h-4 w-4" /> View Details
              </Button>
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  hasPreviousPage, 
  hasNextPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage
}) => {
  if (totalPages <= 1) return null;

  const maxVisiblePages = 5;
  const pages = [];

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <PaginationItem key={i}>
        <PaginationLink
          isActive={currentPage === i}
          onClick={() => onPageChange(i)}
        >
          {i}
        </PaginationLink>
      </PaginationItem>
    );
  }

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={prevPage}
            disabled={!hasPreviousPage}
            className={!hasPreviousPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink onClick={firstPage}>1</PaginationLink>
            </PaginationItem>
            {startPage > 2 && <PaginationEllipsis />}
          </>
        )}

        {pages}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <PaginationEllipsis />}
            <PaginationItem>
              <PaginationLink onClick={lastPage}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            onClick={nextPage}
            disabled={!hasNextPage}
            className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default function AllExams() {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedExam, setSelectedExam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const tableRef = useRef(null);

  // Use the pagination hook with the filtered exams
  const {
    currentPage,
    totalPages,
    paginatedItems: currentExams,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasPreviousPage,
    hasNextPage
  } = usePagination(filteredExams, 10, {
    scrollToRef: tableRef,
    scrollOptions: { behavior: 'smooth' }
  });

  // Load exams using the API module
  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const data = await ExamAPI.fetchExams();
        
        // Set exams directly as requested - no filtering
        setExams(data);
      } catch (err) {
        console.error('Error loading exams:', err);
        setError('Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  // Filter and sort exams
  useEffect(() => {
    let result = [...exams];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(exam =>
        exam.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case 'start_date':
          valueA = new Date(a.start_date);
          valueB = new Date(b.start_date);
          break;
        case 'end_date':
          valueA = new Date(a.end_date);
          valueB = new Date(b.end_date);
          break;
        case 'updated_at':
          valueA = new Date(a.updated_at || a.created_at);
          valueB = new Date(b.updated_at || b.created_at);
          break;
        default:
          valueA = new Date(a.start_date);
          valueB = new Date(b.start_date);
      }

      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredExams(result);
  }, [exams, searchQuery, sortBy, sortDirection]);

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setDialogOpen(true);
  };

  const startIndex = (currentPage - 1) * 10;
  const endIndex = Math.min(startIndex + 10, filteredExams.length);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-40 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Exam Catalogue</h1>
            <p className="mt-1 text-muted-foreground text-base md:text-lg">
              Browse and manage all your exams
            </p>
          </div>
          <Button asChild size="lg" className="h-10 w-full sm:w-auto">
            <Link to="/exams/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Exam
            </Link>
          </Button>
        </div>

        <Card className="border border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <SortDropdown
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card className="border border-border">
            <CardContent className="p-10 flex justify-center">
              <p className="text-muted-foreground">Loading exams...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border border-border">
            <CardContent className="p-10">
              <div className="flex items-center justify-center text-destructive">
                <AlertCircle className="mr-2 h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border border-border" ref={tableRef}>
              <CardHeader className="pb-2">
                <CardTitle>Browse Exams ({filteredExams.length})</CardTitle>
                <CardDescription>
                  Showing {Math.min(filteredExams.length, startIndex + 1)}-{endIndex} of {filteredExams.length} exams
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ExamsTable
                  exams={currentExams}
                  onExamClick={handleExamClick}
                />
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-center items-center">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  hasPreviousPage={hasPreviousPage}
                  hasNextPage={hasNextPage}
                  nextPage={nextPage}
                  prevPage={prevPage}
                  firstPage={firstPage}
                  lastPage={lastPage}
                />
              </CardFooter>
            </Card>
          </>
        )}

        <ExamDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          exam={selectedExam}
        />
      </main>
      <Footer />
    </div>
  );
}