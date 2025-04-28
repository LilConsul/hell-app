import {useEffect, useState} from "react";
import {useAdmin} from "@/contexts/admin-context";
import {Navbar} from "@/components/navbar";
import {Footer} from "@/components/footer";
import {UsersDataTable} from "@/components/users-data-table";
import {UserActionsDialog} from "@/components/user-actions-dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {AlertTriangle, RefreshCw, Search, Shield, Trash, UserCheck} from "lucide-react";

function AdminPanel() {
  const {
    filteredUsers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    pagination,
    setPagination,
    selectedUsers,
    fetchUsers,
    changeUserRole,
    deleteUser,
    batchDeleteUsers,
    batchChangeUserRole,
    batchVerifyUsers,
    changeVerification,
    getUserFullName,
    totalFilteredUsers
  } = useAdmin();

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showBatchRoleDialog, setShowBatchRoleDialog] = useState(false);
  const [showBatchVerifyDialog, setShowBatchVerifyDialog] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [batchNewRole, setBatchNewRole] = useState("student");
  const [operationError, setOperationError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Set the current date and time in the required format
  useEffect(() => {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
    setCurrentDateTime(formatted);
  }, []);

  // Current user from admin_context
  const currentUser = window.admin_context?.currentUser || "LilConsul";

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
      await batchDeleteUsers(false);
      setShowBatchDeleteDialog(false);
    } catch (err) {
      setOperationError(err.message || "Failed to delete selected users");
      console.error("Failed to delete selected users:", err);
    }
  };

  // Handle batch role change confirmation
  const handleBatchRoleChangeConfirm = async () => {
    setOperationError(null);

    try {
      await batchChangeUserRole(batchNewRole, false);
      setShowBatchRoleDialog(false);
    } catch (err) {
      setOperationError(err.message || "Failed to change role for selected users");
      console.error("Failed to change role for selected users:", err);
    }
  };

  // Handle batch verify confirmation
  const handleBatchVerifyConfirm = async () => {
    setOperationError(null);

    try {
      await batchVerifyUsers(false);
      setShowBatchVerifyDialog(false);
    } catch (err) {
      setOperationError(err.message || "Failed to verify selected users");
      console.error("Failed to verify selected users:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar/>

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Header with current user info */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <div className="text-sm text-muted-foreground">
                Logged in as: <span className="font-semibold">{currentUser}</span>
                <div className="text-xs">{currentDateTime || "2025-04-27 15:45:02"}</div>
              </div>
            </div>
            <p className="text-muted-foreground">
              Manage users, change roles, and control verification status
            </p>
          </div>

          {/* Display any operation errors */}
          {operationError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4"/>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{operationError}</AlertDescription>
            </Alert>
          )}

          {/* Search and actions */}
          <Card>
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Users</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchUsers}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}/>
                  </Button>
                </div>
              </div>
              <CardDescription>
                {totalFilteredUsers} {totalFilteredUsers === 1 ? "user" : "users"} found
                {selectedUsers.length > 0 && ` (${selectedUsers.length} selected)`}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <div className="flex flex-col space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <Input
                    placeholder="Search by first name, last name, full name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Batch actions */}
                <div className="pt-3 border-t">
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <div className="flex-1">
                      <Button
                        variant={selectedUsers.length === 0 ? "outline" : "secondary"}
                        size="sm"
                        className="w-full transition-all duration-200"
                        onClick={() => setShowBatchRoleDialog(true)}
                        disabled={selectedUsers.length === 0}
                      >
                        <Shield className="h-4 w-4 mr-2"/>
                        Change Role {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Button
                        variant={selectedUsers.length === 0 ? "outline" : "default"}
                        size="sm"
                        className="w-full transition-all duration-200"
                        onClick={() => setShowBatchVerifyDialog(true)}
                        disabled={selectedUsers.length === 0}
                      >
                        <UserCheck className="h-4 w-4 mr-2"/>
                        Verify {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Button
                        variant={selectedUsers.length === 0 ? "outline" : "destructive"}
                        size="sm"
                        className="w-full transition-all duration-200"
                        onClick={() => setShowBatchDeleteDialog(true)}
                        disabled={selectedUsers.length === 0}
                      >
                        <Trash className="h-4 w-4 mr-2"/>
                        Delete {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Table with TanStack Table */}
          <UsersDataTable
            data={filteredUsers}
            isLoading={isLoading}
            error={error}
            selectedUsers={selectedUsers}
            pagination={pagination}
            setPagination={setPagination}
            onUserAction={(action, user) => {
              setSelectedUser(user);
              if (action === "delete") {
                setShowDeleteDialog(true);
              } else if (action === "changeRole") {
                setNewRole(user.role);
                setShowRoleDialog(true);
              } else if (action === "verify") {
                changeVerification(user.id);
              }
            }}
          />
        </div>
      </main>

      {/* User Action Dialogs */}
      <UserActionsDialog
        type="delete"
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        userName={selectedUser ? getUserFullName(selectedUser) : "this user"}
      />

      <UserActionsDialog
        type="batchDelete"
        isOpen={showBatchDeleteDialog}
        onClose={() => setShowBatchDeleteDialog(false)}
        onConfirm={handleBatchDeleteConfirm}
        count={selectedUsers.length}
      />

      <UserActionsDialog
        type="batchChangeRole"
        isOpen={showBatchRoleDialog}
        onClose={() => setShowBatchRoleDialog(false)}
        onConfirm={handleBatchRoleChangeConfirm}
        count={selectedUsers.length}
        role={batchNewRole}
        onRoleChange={setBatchNewRole}
      />

      <UserActionsDialog
        type="batchVerify"
        isOpen={showBatchVerifyDialog}
        onClose={() => setShowBatchVerifyDialog(false)}
        onConfirm={handleBatchVerifyConfirm}
        count={selectedUsers.length}
      />

      <UserActionsDialog
        type="changeRole"
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        onConfirm={handleRoleChange}
        userName={selectedUser ? getUserFullName(selectedUser) : "this user"}
        role={newRole}
        onRoleChange={setNewRole}
      />

      <Footer/>
    </div>
  );
}

export default AdminPanel;

