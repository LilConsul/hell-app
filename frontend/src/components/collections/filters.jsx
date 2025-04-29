import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// correct to work on based on frontend
export function CollectionFilters({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  filters = {
    dateRange: "all",
    questionCount: [0, 100],
    createdBy: "all",
  },
  setFilters,
  applyFilters,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleClearFilters = () => {
    setFilters({
      dateRange: "all",
      questionCount: [0, 100],
      createdBy: "all",
    })
  }

  const hasActiveFilters =
    filters.dateRange !== "all" ||
    filters.questionCount[0] > 0 ||
    filters.questionCount[1] < 100 ||
    filters.createdBy !== "all"

  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex w-full items-center space-x-2 md:w-2/3">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search collections..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              title="Filter"
              className={hasActiveFilters ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                <Button variant="ghost" size="sm" onClick={handleClearFilters} disabled={!hasActiveFilters}>
                  <X className="mr-2 h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Question Count</Label>
                  <span className="text-xs text-muted-foreground">
                    {filters.questionCount[0]} - {filters.questionCount[1] === 100 ? "100+" : filters.questionCount[1]}
                  </span>
                </div>
                <Slider
                  defaultValue={[0, 100]}
                  min={0}
                  max={100}
                  step={5}
                  value={filters.questionCount}
                  onValueChange={(value) => setFilters({ ...filters, questionCount: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Created By</Label>
                <Select
                  value={filters.createdBy}
                  onValueChange={(value) => setFilters({ ...filters, createdBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select creator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All creators</SelectItem>
                    <SelectItem value="me">Me</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button
                className="w-full"
                onClick={() => {
                  applyFilters()
                  setIsFilterOpen(false)
                }}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center space-x-2">
        {hasActiveFilters && (
          <Badge variant="outline" className="mr-2">
            {
              Object.values(filters).filter(
                (f) => (Array.isArray(f) && (f[0] > 0 || f[1] < 100)) || (!Array.isArray(f) && f !== "all"),
              ).length
            }{" "}
            active filters
          </Badge>
        )}
        <Tabs defaultValue={activeFilter} className="w-full md:w-auto" onValueChange={setActiveFilter} value={activeFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Public</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}