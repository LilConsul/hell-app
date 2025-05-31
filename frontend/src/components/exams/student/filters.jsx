import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter, 
  X, 
  SortAsc,
  Calendar,
  Clock,
  RotateCcw,
  Target
} from "lucide-react";

const statusFilters = [
  { value: "all", label: "All Exams", count: 0 },
  { value: "active", label: "Active", count: 0 },
  { value: "not_started", label: "Not Started", count: 0 },
  { value: "in_progress", label: "In Progress", count: 0 },
  { value: "overdue", label: "Overdue", count: 0 },
  { value: "submitted", label: "Submitted", count: 0 },
  { value: "completed", label: "Completed", count: 0 },
];

const sortOptions = [
  { value: "due-date-nearest", label: "Due Date (Nearest)" },
  { value: "due-date-farthest", label: "Due Date (Farthest)" },
  { value: "start-date-nearest", label: "Start Date (Nearest)" },
  { value: "start-date-farthest", label: "Start Date (Farthest)" },
  { value: "title-az", label: "Title (A-Z)" },
  { value: "title-za", label: "Title (Z-A)" },
  { value: "max-attempts-high", label: "Most Max Attempts" },
  { value: "max-attempts-low", label: "Least Max Attempts" },
];

const dateRangeOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

const dueDateOptions = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due Today" },
  { value: "week", label: "Due This Week" },
  { value: "month", label: "Due This Month" },
];

const attemptOptions = [
  { value: "all", label: "All" },
  { value: "none", label: "No Attempts Used" },
  { value: "some", label: "Some Attempts Used" },
  { value: "max", label: "Max Attempts Used" },
];

export function ExamFilters({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  filters,
  setFilters,
  applyFilters,
  sortOption,
  setSortOption,
  allExams,
  getExamStatus
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Calculate counts for status filters using the getExamStatus function
  const statusCounts = statusFilters.map(filter => {
    if (filter.value === "all") {
      return { ...filter, count: allExams.length };
    }
    return {
      ...filter,
      count: allExams.filter(exam => getExamStatus(exam) === filter.value).length
    };
  });

  const hasActiveFilters = () => {
    return filters.dateRange !== "all" ||
           filters.dueDate !== "all" ||
           filters.attempts !== "all" ||
           filters.maxAttempts[0] !== 1 ||
           filters.maxAttempts[1] !== 10;
  };

  const clearAllFilters = () => {
    setFilters({
      dateRange: "all",
      dueDate: "all",
      attempts: "all",
      maxAttempts: [1, 10],
    });
    setSearchQuery("");
    setActiveFilter("all");
    setSortOption("due-date-nearest");
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Format max attempts display
  const formatMaxAttempts = (value) => {
    return value >= 10 ? "10+" : value.toString();
  };

  return (
    <div className="space-y-4">
      {/* Search and Primary Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search exams by title or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[200px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters() && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    !
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {hasActiveFilters() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date Range
                  </Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => updateFilter("dateRange", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Due Date
                  </Label>
                  <Select
                    value={filters.dueDate}
                    onValueChange={(value) => updateFilter("dueDate", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dueDateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Attempts Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Attempts
                  </Label>
                  <Select
                    value={filters.attempts}
                    onValueChange={(value) => updateFilter("attempts", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {attemptOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Attempts Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Max Attempts Range
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={filters.maxAttempts}
                      onValueChange={(value) => updateFilter("maxAttempts", value)}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{filters.maxAttempts[0]}</span>
                      <span>{formatMaxAttempts(filters.maxAttempts[1])}</span>
                    </div>
                  </div>
                </div>

                {/* Apply Filters Button */}
                <Button 
                  onClick={() => {
                    applyFilters();
                    setIsFilterOpen(false);
                  }}
                  className="w-full"
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusCounts.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.value)}
            className="flex items-center gap-2"
          >
            {filter.label}
            <Badge variant="secondary" className="ml-1">
              {filter.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Active Filters Display */}
      {(hasActiveFilters() || searchQuery) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {searchQuery && (
            <Badge variant="outline" className="gap-1">
              Search: "{searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.dateRange !== "all" && (
            <Badge variant="outline" className="gap-1">
              Start: {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("dateRange", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.dueDate !== "all" && (
            <Badge variant="outline" className="gap-1">
              Due: {dueDateOptions.find(opt => opt.value === filters.dueDate)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("dueDate", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.attempts !== "all" && (
            <Badge variant="outline" className="gap-1">
              Attempts: {attemptOptions.find(opt => opt.value === filters.attempts)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("attempts", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {(filters.maxAttempts[0] !== 1 || filters.maxAttempts[1] !== 10) && (
            <Badge variant="outline" className="gap-1">
              Max Attempts: {filters.maxAttempts[0]}-{formatMaxAttempts(filters.maxAttempts[1])}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("maxAttempts", [1, 10])}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-destructive hover:text-destructive"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}