import {useState} from "react";
import {Checkbox} from "@/components/ui/checkbox";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {ArrowDown, ArrowUp, CheckCircle2, Loader2, MoreHorizontal, Shield, Trash, UserCheck, UserX} from "lucide-react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Skeleton} from "@/components/ui/skeleton";
import {useAdmin} from "@/contexts/admin-context";
import {cn} from "@/lib/utils";

export function UsersDataTable({
                                 data = [],
                                 isLoading,
                                 error,
                                 pagination,
                                 setPagination,
                                 onUserAction,
                               }) {
  const [sortField, setSortField] = useState("last_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const {toggleUserSelection, toggleSelectAll, selectedUsers, operationLoading, totalFilteredUsers} = useAdmin();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if all displayed users are selected
  const areAllCurrentPageSelected = data.length > 0 &&
    data.every(user => selectedUsers.includes(user.id));

  // Check if some but not all displayed users are selected
  const areSomeCurrentPageSelected = data.length > 0 &&
    data.some(user => selectedUsers.includes(user.id)) &&
    !areAllCurrentPageSelected;

  // Column definitions
  const columns = [
    {id: 'select', header: 'Select', sortable: false, size: 50},
    {id: 'first_name', header: 'First Name', sortable: true, size: 120},
    {id: 'last_name', header: 'Last Name', sortable: true, size: 120},
    {id: 'email', header: 'Email', sortable: true, size: 200},
    {id: 'role', header: 'Role', sortable: true, size: 100},
    {id: 'is_verified', header: 'Verification', sortable: true, size: 120},
    {id: 'created_at', header: 'Created at', sortable: true, size: 160},
    {id: 'updated_at', header: 'Updated at', sortable: true, size: 160},
    {id: 'actions', header: '', sortable: false, size: 80},
  ];

  const handleSelectAllCurrentPage = (checked) => {
    const currentPageUserIds = data.map(user => user.id);

    currentPageUserIds.forEach(userId => {
      const isCurrentlySelected = selectedUsers.includes(userId);
      if (checked && !isCurrentlySelected) {
        toggleUserSelection(userId);
      } else if (!checked && isCurrentlySelected) {
        toggleUserSelection(userId);
      }
    });
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    // Handle null or undefined values
    if (!a[sortField] && a[sortField] !== false) return 1;
    if (!b[sortField] && b[sortField] !== false) return -1;

    const aValue = a[sortField];
    const bValue = b[sortField];

    // If both values are equal, don't change order
    if (aValue === bValue) return 0;

    // Special handling for boolean values (like is_verified)
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      // For boolean values in ascending order, true comes before false
      // For descending order, false comes before true
      return sortDirection === "asc"
        ? (aValue ? -1 : 1)
        : (aValue ? 1 : -1);
    }

    // String comparison for string values
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Numeric comparison for numeric values
    const comparison = aValue < bValue ? -1 : 1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Compute pagination values based on totalFilteredUsers from context
  const totalItems = totalFilteredUsers ?? data.length;
  const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
  const currentPage = pagination.currentPage;
  
  // Calculate start and end indexes for pagination
  const startIndex = (currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  
  // Apply pagination to the sorted data
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const paginationItems = [];
  if (totalPages > 0) {
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        paginationItems.push(i);
      } else if (
        (i === 2 && currentPage > 3) ||
        (i === totalPages - 1 && currentPage < totalPages - 2)
      ) {
        paginationItems.push("ellipsis");
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead
                  key={column.id}
                  style={{width: `${column.size}px`}}
                  className={column.sortable ? "cursor-pointer select-none" : ""}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                >
                  {column.id === 'select' ? (
                    <div
                      className="flex items-center justify-center h-full w-full p-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAllCurrentPage(!areAllCurrentPageSelected);
                      }}
                    >
                      <Checkbox
                        checked={areAllCurrentPageSelected}
                        indeterminate={areSomeCurrentPageSelected}
                        className="rounded-sm data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary/80 cursor-pointer"
                        aria-label="Select all on current page"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {column.header}
                      {column.sortable && sortField === column.id && (
                        <div className="ml-1">
                          {sortDirection === "asc" ?
                            <ArrowUp className="h-4 w-4"/> :
                            <ArrowDown className="h-4 w-4"/>}
                        </div>
                      )}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array(5).fill(0).map((_, i) => (
                <TableRow key={`loading-${i}`}>
                  <TableCell><Skeleton className="h-5 w-5"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-16"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto"/></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center p-4 text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center p-4 text-muted-foreground">
                  {totalItems > 0 ? "No users found on this page" : "No users found"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "transition-colors",
                    selectedUsers.includes(row.id) && "bg-muted/50",
                    "hover:bg-muted/30"
                  )}
                >
                  <TableCell className="p-0">
                    <div
                      className="flex items-center justify-center h-full w-full p-4 cursor-pointer"
                      onClick={() => toggleUserSelection(row.id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(row.id)}
                        className="rounded-sm data-[state=checked]:bg-primary cursor-pointer"
                        aria-label={`Select user ${row.first_name} ${row.last_name}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{row.first_name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{row.last_name || '-'}</span>
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Badge variant={
                      row.role === "admin" ? "destructive" :
                        row.role === "teacher" ? "default" :
                          "secondary"
                    }>
                      {row.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.is_verified ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                        <CheckCircle2 className="h-4 w-4"/>
                        <span className="text-xs">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                        <UserX className="h-4 w-4"/>
                        <span className="text-xs">Unverified</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(row.created_at)}</TableCell>
                  <TableCell>{formatDate(row.updated_at)}</TableCell>
                  <TableCell>
                    <div className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            {operationLoading[row.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin"/>
                            ) : (
                              <MoreHorizontal className="h-4 w-4"/>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onUserAction('changeRole', row)}
                            className="cursor-pointer"
                            disabled={operationLoading[row.id]}
                          >
                            <Shield className="h-4 w-4 mr-2"/>
                            Change Role
                          </DropdownMenuItem>
                          {!row.is_verified && (
                            <DropdownMenuItem
                              onClick={() => onUserAction('verify', row)}
                              className="cursor-pointer"
                              disabled={operationLoading[row.id]}
                            >
                              <UserCheck className="h-4 w-4 mr-2"/>
                              Verify User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onUserAction('delete', row)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                            disabled={operationLoading[row.id]}
                          >
                            <Trash className="h-4 w-4 mr-2"/>
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPagination(prev => ({...prev, currentPage: Math.max(1, prev.currentPage - 1)}))}
                disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <span className="px-3 py-2">...</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={currentPage === item}
                    onClick={() => setPagination(prev => ({...prev, currentPage: item}))}
                    className="cursor-pointer"
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPagination(prev => ({
                  ...prev,
                  currentPage: Math.min(totalPages, prev.currentPage + 1)
                }))}
                disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}


