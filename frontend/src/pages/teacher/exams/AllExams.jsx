import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { apiRequest } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  Clock, 
  Users, 
  Edit, 
  ArrowUpDown,
  AlertCircle,
  FileText,
  BarChart,
  PlusCircle
} from 'lucide-react';

export default function AllExams() {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExam, setSelectedExam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch exam instances from the API
    apiRequest('/api/v1/exam/teacher/exam-instances/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setExams(data);
      })
      .catch(() => setError('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let result = [...exams];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(exam => exam.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(exam => 
        exam.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;
      
      switch(sortBy) {
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
  }, [exams, searchQuery, statusFilter, sortBy, sortDirection]);

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

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setDialogOpen(true);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getExamStatus = (exam) => {
    if (exam.status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    } else if (now > new Date(exam.end_date)) {
      return <Badge variant="destructive">Ended</Badge>;
    } else if (new Date(exam.start_date) <= now && new Date(exam.end_date) >= now) {
      return <Badge variant="warning">Ongoing</Badge>;
    } else {
      return <Badge variant="default">Upcoming</Badge>;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExams = filteredExams.slice(startIndex, endIndex);

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    // Logic for showing a limited number of page links
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
            onClick={() => setCurrentPage(i)}
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
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}
          
          {pages}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1 py-10 px-60 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">All Exams</h1>
            <p className="mt-1 text-muted-foreground text-lg">
              Browse and manage all your exams in one place
            </p>
          </div>
          <Button asChild size="lg" className="h-10">
            <Link to="/create-exams">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Exam
            </Link>
          </Button>
        </div>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search exams by title..."
                  className="pl-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">All Exams</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
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
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle>All Exams ({filteredExams.length})</CardTitle>
                <CardDescription>
                  Showing {Math.min(filteredExams.length, startIndex + 1)}-{Math.min(filteredExams.length, endIndex)} of {filteredExams.length} exams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentExams.length > 0 ? (
                      currentExams.map((exam) => (
                        <TableRow
                          key={exam.id}
                          onClick={() => handleExamClick(exam)}
                          className="hover:bg-muted/50 cursor-pointer"
                        >
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>{getExamStatus(exam)}</TableCell>
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
                                      to={`/exam/${exam.id}/edit`}
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
                                      to={`/exam/${exam.id}/report`}
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No exams match your search criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {filteredExams.length} {filteredExams.length === 1 ? 'exam' : 'exams'} found
                </div>
                
                {totalPages > 1 && renderPagination()}
              </CardFooter>
            </Card>

          </>
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
                        <p>{getExamStatus(selectedExam)}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        <h3 className="font-medium">Assigned Students</h3>
                      </div>
                      {selectedExam.assigned_students && selectedExam.assigned_students.length > 0 ? (
                        <div className="max-h-[120px] overflow-y-auto border rounded-md p-2">
                          <ul className="space-y-1">
                            {selectedExam.assigned_students.map((student, index) => (
                              <li key={index} className="text-sm flex items-center">
                                <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                                {student.name || student.email || `Student ${index + 1}`}
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
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Close
                  </Button>
                  <div className="flex space-x-2">
                    <Link to={`/exam/${selectedExam.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button>
                        <FileText className="mr-2 h-4 w-4" /> View Details
                      </Button>
                    </Link>
                  </div>
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
