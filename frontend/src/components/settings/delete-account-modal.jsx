import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Trash2,
  Bell
} from "lucide-react";

export const DeleteAccountModal = memo(function DeleteAccountModal({
  open,
  onOpenChange,
  deleteConfirmText,
  setDeleteConfirmText,
  handleSendDeleteConfirmation,
  isDeletionEmailSent,
  errorMessage,
  user
}) {
  const handleOpenChange = useCallback((isOpen) => {
    if (!isOpen) {
      setDeleteConfirmText("");
    }
    onOpenChange(isOpen);
  }, [onOpenChange, setDeleteConfirmText]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-neutral-900">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-destructive mb-2">
            <Trash2 size={18} />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-sm">
            This action cannot be undone. To proceed, we'll send a confirmation email to your address.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <div className="rounded-md border border-red-300 dark:border-red-900 overflow-hidden">
            <div className="bg-red-500 py-2 px-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
                <h4 className="font-semibold text-destructive-foreground">WARNING</h4>
              </div>
            </div>
            <div className="bg-destructive/10 p-3 dark:bg-red-900/20">
              <div className="space-y-2">
                <p className="font-medium text-destructive dark:text-red-300 text-sm">You are requesting to delete your account!</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-destructive flex items-center justify-center mt-0.5">
                      <span className="text-destructive-foreground text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-destructive-foreground/80 dark:text-red-200/80">All your data will be permanently erased</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-destructive flex items-center justify-center mt-0.5">
                      <span className="text-destructive-foreground text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-destructive-foreground/80 dark:text-red-200/80">Your exam history and results will be lost</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-destructive flex items-center justify-center mt-0.5">
                      <span className="text-destructive-foreground text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-destructive-foreground/80 dark:text-red-200/80">Your account settings and personal information will be removed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-2 pb-2">
          <Card className="mb-3 dark:bg-neutral-800 dark:border-neutral-700">
            <CardContent className="p-3 pt-3">
              <div className="flex items-center text-center gap-2">
                <div className="p-2 rounded-full bg-secondary dark:bg-neutral-700">
                  <Bell className="h-5 w-5 text-secondary-foreground dark:text-neutral-200" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Email Confirmation Required</p>
                  <p className="text-xs text-muted-foreground">
                    We'll send a confirmation email to <span className="font-semibold">{user?.email}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Label htmlFor="confirm-delete" className="text-xs font-medium mb-2 block">Type "DELETE" to confirm</Label>
          <Input
            id="confirm-delete"
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className={cn(
              "dark:bg-neutral-800 dark:border-neutral-700",
              deleteConfirmText === "DELETE" && "border-destructive dark:border-red-500"
            )}
          />
          {errorMessage && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle size={12} className="text-destructive" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="sm:w-auto w-full dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendDeleteConfirmation}
            variant="destructive"
            className="sm:w-auto w-full"
            disabled={deleteConfirmText !== "DELETE" || isDeletionEmailSent}
            size="sm"
          >
            {isDeletionEmailSent ? (
              <div className="flex items-center gap-1">
                <span className="animate-spin">⟳</span>
                <span>Sending...</span>
              </div>
            ) : (
              "Send Confirmation Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});