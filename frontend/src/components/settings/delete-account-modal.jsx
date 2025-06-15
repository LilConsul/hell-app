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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 size={18} />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. To proceed, we'll send a confirmation email to your address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden">
            <div className="bg-neutral-200 dark:bg-neutral-800 py-2 px-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">WARNING</h4>
              </div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3">
              <div className="space-y-2">
                <p className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">You are requesting to delete your account!</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-neutral-600 dark:bg-neutral-400 flex items-center justify-center mt-0.5">
                      <span className="text-white dark:text-neutral-900 text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300">All your data will be permanently erased</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-neutral-600 dark:bg-neutral-400 flex items-center justify-center mt-0.5">
                      <span className="text-white dark:text-neutral-900 text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300">Your exam history and results will be lost</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-neutral-600 dark:bg-neutral-400 flex items-center justify-center mt-0.5">
                      <span className="text-white dark:text-neutral-900 text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300">Your account settings and personal information will be removed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="dark:bg-neutral-800 dark:border-neutral-700">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-full bg-secondary dark:bg-neutral-700">
                <Bell className="h-4 w-4 text-secondary-foreground dark:text-neutral-200" />
              </div>
              <div>
                <p className="font-medium text-sm">Email Confirmation Required</p>
                <p className="text-xs text-muted-foreground">
                  We'll send a confirmation email to <span className="font-semibold">{user?.email}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm">
              Type "DELETE" to confirm
            </Label>
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
          </div>

          {errorMessage && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle size={12} className="text-destructive" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendDeleteConfirmation}
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={deleteConfirmText !== "DELETE" || isDeletionEmailSent}
          >
            {isDeletionEmailSent ? (
              <div className="flex items-center gap-2">
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