import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, X, SlidersHorizontal, Check, User, Users, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function CollectionFilters({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  filters = {
    dateRange: "all",
    questionCount: [0, 100],
    createdBy: "all",
    specificUsers: [],
    lastUpdated: "all",
  },
  setFilters,
  applyFilters,
  sortOption,
  setSortOption,
  allCollections = [],
}) {
  const { user } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  
  // Extract unique users from collections
  const availableUsers = useMemo(() => {
    const usersMap = new Map();
    
    // Current user
    if (user) {
      usersMap.set(user.id, {
        id: user.id,
        name: `${user.first_name} ${user.last_name}` || user.email || "Current User",
        isCurrentUser: true
      });
    }
    
    // Other users
    allCollections.forEach(collection => {
      if (collection.created_by && collection.created_by.id) {
        // Skip if current user
        if (user && collection.created_by.id === user.id) return;
        
        // Add if not in the map
        if (!usersMap.has(collection.created_by.id)) {
          usersMap.set(collection.created_by.id, {
            id: collection.created_by.id,
            name: `${collection.created_by.first_name} ${collection.created_by.last_name}` || "Unknown User",
            isCurrentUser: false
          });
        }
      }
    });
    
    return Array.from(usersMap.values());
  }, [allCollections, user]);
  
  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return availableUsers;
    
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [availableUsers, userSearchQuery]);
  
  const handlePopoverChange = (open) => {
    if (open) {
      setTempFilters({...filters});
    }
    setIsFilterOpen(open);
  };
  
  const handleClearFilters = () => {
    const clearedFilters = {
      dateRange: "all",
      questionCount: [0, 100],
      createdBy: "all",
      specificUsers: [],
      lastUpdated: "all",
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    applyFilters();
  };
  
  const handleApplyFilters = () => {
    // Auto-select published status if filtering by Others
    if (tempFilters.createdBy === "others" && activeFilter !== "published") {
      setActiveFilter("published");
    }
    
    setFilters(tempFilters);
    applyFilters();
    setIsFilterOpen(false);
  };

  const handleAddUser = (selectedUser) => {
    // Check if user is already in the list
    if (!tempFilters.specificUsers.some(user => user.id === selectedUser.id)) {
      setTempFilters({
        ...tempFilters,
        specificUsers: [...tempFilters.specificUsers, selectedUser],
        createdBy: "specific"
      });
    }
    setUserSearchQuery("");
    setIsUserSearchOpen(false);
  };
  
  const handleRemoveUser = (userId) => {
    const updatedUsers = tempFilters.specificUsers.filter(user => user.id !== userId);
    setTempFilters({
      ...tempFilters,
      specificUsers: updatedUsers,
      createdBy: updatedUsers.length === 0 ? "all" : "specific"
    });
  };

  const hasActiveFilters =
    filters.dateRange !== "all" ||
    filters.questionCount[0] > 0 ||
    filters.questionCount[1] < 100 ||
    filters.createdBy !== "all" ||
    filters.specificUsers?.length > 0 ||
    filters.lastUpdated !== "all";
    
  const hasUnappliedChanges = 
    tempFilters.dateRange !== filters.dateRange ||
    tempFilters.questionCount[0] !== filters.questionCount[0] ||
    tempFilters.questionCount[1] !== filters.questionCount[1] ||
    tempFilters.createdBy !== filters.createdBy ||
    tempFilters.specificUsers?.length !== filters.specificUsers?.length ||
    tempFilters.lastUpdated !== filters.lastUpdated;

  const getActiveFiltersCount = () => {
    let count = 0;
    
    if (filters.dateRange !== "all") count++;
    if (filters.lastUpdated !== "all") count++;
    if (filters.questionCount[0] > 0 || filters.questionCount[1] < 100) count++;
    if (filters.createdBy !== "all" && filters.specificUsers?.length === 0) count++;    
    if (filters.specificUsers?.length > 0) count++;
    
    return count;
  };

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
        <Popover open={isFilterOpen} onOpenChange={handlePopoverChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              title="Filter"
              className={hasActiveFilters ? "bg-primary text-primary-foreground dark:text-gray-300 hover:bg-primary/90 dark:hover:text-black" 
                : "dark:border-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-800"}
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {getActiveFiltersCount()}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearFilters} 
                  disabled={!hasActiveFilters}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Creation Date</Label>
                <Select
                  value={tempFilters.dateRange}
                  onValueChange={(value) => setTempFilters({ ...tempFilters, dateRange: value })}
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
                <Label>Last Updated</Label>
                <Select
                  value={tempFilters.lastUpdated}
                  onValueChange={(value) => setTempFilters({ ...tempFilters, lastUpdated: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select update range" />
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
                    {tempFilters.questionCount[0]} - {tempFilters.questionCount[1]}+
                  </span>
                </div>
                <Slider
                  defaultValue={[0, 100]}
                  min={0}
                  max={100}
                  step={5}
                  value={tempFilters.questionCount}
                  onValueChange={(value) => setTempFilters({ ...tempFilters, questionCount: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Created By</Label>
                <Select
                  value={tempFilters.createdBy}
                  onValueChange={(value) => {
                    setTempFilters({ 
                      ...tempFilters, 
                      createdBy: value,
                      // When selecting "all" or "others", clear specific users
                      specificUsers: value === "all" || value === "others" ? [] : tempFilters.specificUsers
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select creator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All creators</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                    <SelectItem value="specific">Specific users</SelectItem>
                  </SelectContent>
                </Select>
                
                {tempFilters.createdBy === "others" && 
                  <div className="text-xs text-amber-500 mt-1">
                    Note: Selecting "Others" will automatically filter by public collections
                  </div>
                }
                
                {tempFilters.createdBy === "specific" && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {tempFilters.specificUsers.map(selectedUser => (
                        <Badge key={selectedUser.id} variant="secondary" className="flex items-center gap-1 py-1">
                          <User className="h-3 w-3" />
                          <span>{selectedUser.isCurrentUser ? `Me (${selectedUser.name})` : selectedUser.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0 rounded-full hover:bg-muted-foreground/20"
                            onClick={() => handleRemoveUser(selectedUser.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      
                      <Popover open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 px-2">
                            <Plus className="h-3 w-3 mr-1" />
                            <span className="text-xs">Add User</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Search users..." 
                              value={userSearchQuery}
                              onValueChange={setUserSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>No users found</CommandEmpty>
                              <CommandGroup>
                                {filteredUsers.map(availableUser => (
                                  <CommandItem
                                    key={availableUser.id}
                                    onSelect={() => handleAddUser(availableUser)}
                                    disabled={tempFilters.specificUsers.some(u => u.id === availableUser.id)}
                                    className={tempFilters.specificUsers.some(u => u.id === availableUser.id) ? "opacity-50" : ""}
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{availableUser.isCurrentUser ? `Me (${availableUser.name})` : availableUser.name}</span>
                                    {tempFilters.specificUsers.some(u => u.id === availableUser.id) && (
                                      <Check className="ml-auto h-4 w-4" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {tempFilters.specificUsers.length === 0 && (
                      <div className="text-xs text-amber-500">
                        Please add at least one user
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <Button
                className="w-full"
                onClick={handleApplyFilters}
                disabled={!hasUnappliedChanges || (tempFilters.createdBy === "specific" && tempFilters.specificUsers.length === 0)}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              title="Sort"
              className="dark:border-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-800"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortOption === "updated-newest"}
              onCheckedChange={() => setSortOption("updated-newest")}
            >
              Last Updated (Newest First)
              {sortOption === "updated-newest" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortOption === "updated-oldest"}
              onCheckedChange={() => setSortOption("updated-oldest")}
            >
              Last Updated (Oldest First) 
              {sortOption === "updated-oldest" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortOption === "created-newest"}
              onCheckedChange={() => setSortOption("created-newest")}
            >
              Date Created (Newest First)
              {sortOption === "created-newest" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortOption === "created-oldest"}
              onCheckedChange={() => setSortOption("created-oldest")}
            >
              Date Created (Oldest First)
              {sortOption === "created-oldest" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortOption === "questions-high"}
              onCheckedChange={() => setSortOption("questions-high")}
            >
              Question Count (High to Low)
              {sortOption === "questions-high" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortOption === "questions-low"}
              onCheckedChange={() => setSortOption("questions-low")}
            >
              Question Count (Low to High)
              {sortOption === "questions-low" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuCheckboxItem>
            {filters.specificUsers?.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={sortOption === "user"}
                  onCheckedChange={() => setSortOption("user")}
                >
                  By Selected Users
                  {sortOption === "user" && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center space-x-2">
        {hasActiveFilters && (
          <Badge variant="outline" className="mr-2 flex items-center gap-2 dark:text-white">
            <span>
              {getActiveFiltersCount()}{" "}
              active filters
            </span>
            <Button 
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClearFilters();
              }}
              className="flex h-4 w-4 p-0 items-center justify-center rounded-full hover:bg-muted dark:text-white"
              title="Clear all filters"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        {filters.specificUsers?.length > 0 && (
          <Badge variant="secondary" className="mr-2 flex items-center gap-1 dark:text-white">
            <Users className="h-3 w-3" />
            <span>
              {filters.specificUsers.length} {filters.specificUsers.length === 1 ? 'user' : 'users'}
            </span>
            <Button 
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFilters(prev => ({ ...prev, specificUsers: [], createdBy: "all"}));
                applyFilters();
              }}
              className="flex h-4 w-4 p-0 items-center justify-center rounded-full hover:bg-muted dark:text-white"
              title="Clear user filter"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        <Tabs defaultValue={activeFilter} className="w-full md:w-auto" onValueChange={setActiveFilter} value={activeFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Public</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}