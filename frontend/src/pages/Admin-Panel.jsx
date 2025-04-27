import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/admin-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  Trash,
  UserCheck,
  UserX
} from "lucide-react";

// Fixed table column styles to prevent layout shift during sorting
const tableColumnStyles = {
  checkbox: "w-[50px]",
  firstName: "w-[120px]",
  lastName: "w-[120px]",
  email: "w-[200px]",
  role: "w-[100px]",
  verification: "w-[120px]",
  createdAt: "w-[160px]",
  updatedAt: "w-[160px]",
  actions: "w-[80px]"
};

function AdminPanel() {
  const {
    filteredUsers,
    isLoading,
    operationLoading,
    error,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    verificationFilter,
    setVerificationFilter,
    sortConfig,
    handleSort,
    pagination,
    setPagination,
    selectedUsers,
    toggleUserSelection,
    toggleSelectAll,
    fetchUsers,
    changeUserRole,
    deleteUser,
    batchDeleteUsers,
    changeVerification,
    getUserFullName
  } = useAdmin();

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [operationError, setOperationError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Set the current date and time in the required format
  useEffect(() => {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
    setCurrentDateTime(formatted);
  }, []);

  // Current user from admin_context
  const currentUser = window.admin_context?.currentUser || "Unknown User";

  // Handle role change confirmation
  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    setOperationError(null);

    try {
      await changeUserRole(selectedUser.id, newRole);
      setShowRoleDialog(false);
    } catch (err) {
      setOperationError(err.message || "Failed to change user role");
      console.error("Failed to change user role:", err);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setOperationError(null);

    try {
      await deleteUser(selectedUser.id);
      setShowDeleteDialog(false);
    } catch (err) {
      setOperationError(err.message || "Failed to delete user");
      console.error("Failed to delete user:", err);
    }
  };

  // Handle batch delete without browser confirmation
  const handleBatchDeleteConfirm = async () => {
    setOperationError(null);

    try {
      // Modified batchDeleteUsers to not use window.confirm
      await batchDeleteUsers(false);
      setShowBatchDeleteDialog(false);
    } catch (err) {
      setOperationError(err.message || "Failed to delete selected users");
      console.error("Failed to delete selected users:", err);
    }
  };

  // Handle user verification
  const handleVerification = async (userId) => {
    setOperationError(null);

    try {
      await changeVerification(userId);
    } catch (err) {
      setOperationError(err.message || "Failed to update verification status");
      console.error("Failed to update verification status:", err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate pagination numbers
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  const currentPage = pagination.currentPage;

  // Generate pagination items safely - prevent infinite loop
  const paginationItems = [];
  if (totalPages > 0) {
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Always show first page
        i === totalPages || // Always show last page
        (i >= currentPage - 1 && i <= currentPage + 1) // Show current page and adjacent pages
      ) {
        paginationItems.push(i);
      } else if (
        (i === 2 && currentPage > 3) || // Show ellipsis after first page
        (i === totalPages - 1 && currentPage < totalPages - 2) // Show ellipsis before last page
      ) {
        paginationItems.push("ellipsis");
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Header with current user info */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <div className="text-sm text-muted-foreground">
                Logged in as: <span className="font-semibold">{currentUser}</span>
                <div className="text-xs">{currentDateTime}</div>
              </div>
            </div>
            <p className="text-muted-foreground">
              Manage users, change roles, and control verification status
            </p>
          </div>

          {/* Display any operation errors */}
          {operationError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{operationError}</AlertDescription>
            </Alert>
          )}

          {/* Filters and search */}
          <Card>
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Users</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchUsers}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {pagination.totalItems} {pagination.totalItems === 1 ? "user" : "users"} found
                {selectedUsers.length > 0 && ` (${selectedUsers.length} selected)`}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <div className="flex flex-col space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Expanded filters */}
                {showFilters && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by Role</label>
                      <Select
                        value={roleFilter}
                        onValueChange={setRoleFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by Verification</label>
                      <Select
                        value={verificationFilter}
                        onValueChange={setVerificationFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All users" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All users</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Batch actions */}
                {selectedUsers.length > 0 && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBatchDeleteDialog(true)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedUsers.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Table with fixed column widths */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={tableColumnStyles.checkbox}>
                    <Checkbox
                      checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer ${tableColumnStyles.firstName}`}
                    onClick={() => handleSort("first_name")}
                  >
                    First Name
                    {sortConfig.key === "first_name" && (
                      sortConfig.direction === "asc" ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer ${tableColumnStyles.lastName}`}
                    onClick={() => handleSort("last_name")}
                  >
                    Last Name
                    {sortConfig.key === "last_name" && (
                      sortConfig.direction === "asc" ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer ${tableColumnStyles.email}`}
                    onClick={() => handleSort("email")}
                  >
                    Email
                    {sortConfig.key === "email" && (
                      sortConfig.direction === "asc" ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer ${tableColumnStyles.role}`}
                    onClick={() => handleSort("role")}
                  >
                    Role
                    {sortConfig.key === "role" && (
                      sortConfig.direction === "asc" ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer ${tableColumnStyles.verification}`}
                    onClick={() => handleSort("is_verified")}
                  >
                    Verification
                    {sortConfig.key === "is_verified" && (
                      sortConfig.direction === "asc" ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer ${tableColumnStyles.createdAt}`}
                    onClick={() => handleSort("created_at")}
                  >
                    Created at
                    {sortConfig.key === "created_at" && (
                      sortConfig.direction === "asc" ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer ${tableColumnStyles.updatedAt}`}
                    onClick={() => handleSort("updated_at")}
                  >
                    Updated at
                    {sortConfig.key === "updated_at" && (
                      sortConfig.direction === "asc" ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead className={`text-right ${tableColumnStyles.actions}`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center p-4 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center p-4 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.first_name || '-'}</TableCell>
                      <TableCell className="font-medium">{user.last_name || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === "admin" ? "destructive" :
                            user.role === "teacher" ? "default" :
                              "secondary"
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_verified ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                            <UserX className="h-4 w-4" />
                            <span className="text-xs">Unverified</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              {operationLoading[user.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setShowRoleDialog(true);
                              }}
                              className="cursor-pointer"
                              disabled={operationLoading[user.id]}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            {!user.is_verified && (
                              <DropdownMenuItem
                                onClick={() => handleVerification(user.id)}
                                className="cursor-pointer"
                                disabled={operationLoading[user.id]}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Verify User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                              className="cursor-pointer text-destructive focus:text-destructive"
                              disabled={operationLoading[user.id]}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
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
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: item }))}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
                    disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser ? getUserFullName(selectedUser) : "this user"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Users</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUsers.length} users? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBatchDeleteConfirm}>
              Delete All Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser ? getUserFullName(selectedUser) : "this user"}.
            </DialogDescription>
          </DialogHeader>

          <Select
            value={newRole}
            onValueChange={setNewRole}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default AdminPanel;