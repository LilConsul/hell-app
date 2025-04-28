import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Trash, UserCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserActionsDialog({
  type,
  isOpen,
  onClose,
  onConfirm,
  userName = "this user",
  count = 0,
  role = "",
  onRoleChange = () => {}
}) {
  const renderDialogIcon = () => {
    switch (type) {
      case "delete":
      case "batchDelete":
        return <Trash className="h-12 w-12 text-destructive" />;
      case "changeRole":
      case "batchChangeRole":
        return <Shield className="h-12 w-12 text-primary" />;
      case "batchVerify":
        return <UserCheck className="h-12 w-12 text-green-600" />;
      default:
        return null;
    }
  };

  const isDestructive = type === "delete" || type === "batchDelete";
  
  const renderDialogContent = () => {
    switch (type) {
      case "delete":
        return (
          <>
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                {renderDialogIcon()}
              </div>
              <DialogTitle className="text-center text-xl">Delete User</DialogTitle>
              <DialogDescription className="text-center">
                Are you sure you want to delete <span className="font-medium">{userName}</span>?
                <div className="mt-2 text-destructive-foreground flex items-center justify-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This action cannot be undone.</span>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-2 mt-4">
              <Button variant="outline" onClick={onClose} className="sm:min-w-[100px]">
                Cancel
              </Button>
              <Button variant="destructive" onClick={onConfirm} className="sm:min-w-[100px]">
                Delete
              </Button>
            </DialogFooter>
          </>
        );
      
      case "batchDelete":
        return (
          <>
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                {renderDialogIcon()}
              </div>
              <DialogTitle className="text-center text-xl">Delete Selected Users</DialogTitle>
              <DialogDescription className="text-center">
                Are you sure you want to delete <span className="font-semibold">{count}</span> {count === 1 ? 'user' : 'users'}?
                <div className="mt-2 text-destructive-foreground flex items-center justify-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This action cannot be undone.</span>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-2 mt-4">
              <Button variant="outline" onClick={onClose} className="sm:min-w-[100px]">
                Cancel
              </Button>
              <Button variant="destructive" onClick={onConfirm} className="sm:min-w-[100px]">
                Delete All Selected
              </Button>
            </DialogFooter>
          </>
        );
      
      case "batchChangeRole":
        return (
          <>
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                {renderDialogIcon()}
              </div>
              <DialogTitle className="text-center text-xl">Change Role for Selected Users</DialogTitle>
              <DialogDescription className="text-center">
                Change the role for <span className="font-semibold">{count}</span> {count === 1 ? 'user' : 'users'}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4 mx-auto max-w-[300px]">
              <label className="text-sm font-medium mb-2 block">
                Select new role
              </label>
              <Select
                value={role}
                onValueChange={onRoleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter className="sm:justify-center gap-2">
              <Button variant="outline" onClick={onClose} className="sm:min-w-[100px]">
                Cancel
              </Button>
              <Button onClick={onConfirm} className="sm:min-w-[100px]">
                Apply Changes
              </Button>
            </DialogFooter>
          </>
        );
      
      case "batchVerify":
        return (
          <>
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                {renderDialogIcon()}
              </div>
              <DialogTitle className="text-center text-xl">Verify Selected Users</DialogTitle>
              <DialogDescription className="text-center">
                Are you sure you want to verify <span className="font-semibold">{count}</span> {count === 1 ? 'user' : 'users'}?
                <div className="mt-2 text-muted-foreground text-sm">
                  Only users who are not already verified will be affected.
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-2 mt-4">
              <Button variant="outline" onClick={onClose} className="sm:min-w-[100px]">
                Cancel
              </Button>
              <Button onClick={onConfirm} className="sm:min-w-[100px]">
                Verify Users
              </Button>
            </DialogFooter>
          </>
        );
      
      case "changeRole":
        return (
          <>
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                {renderDialogIcon()}
              </div>
              <DialogTitle className="text-center text-xl">Change User Role</DialogTitle>
              <DialogDescription className="text-center">
                Update the role for <span className="font-medium">{userName}</span>.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4 mx-auto max-w-[300px]">
              <label className="text-sm font-medium mb-2 block">
                Select new role
              </label>
              <Select
                value={role}
                onValueChange={onRoleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter className="sm:justify-center gap-2">
              <Button variant="outline" onClick={onClose} className="sm:min-w-[100px]">
                Cancel
              </Button>
              <Button onClick={onConfirm} className="sm:min-w-[100px]">
                Save Changes
              </Button>
            </DialogFooter>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "sm:max-w-[425px]",
          isDestructive && "border-destructive/50"
        )}
      >
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
