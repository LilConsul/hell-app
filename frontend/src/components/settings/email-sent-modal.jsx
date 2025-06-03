import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Mail } from "lucide-react";

export const EmailSentModal = memo(function EmailSentModal({
  open,
  onOpenChange,
  user
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-neutral-900">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle size={20} className="text-neutral-950 dark:text-neutral-50" />
            Account Deletion Initiated
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Card className="dark:bg-neutral-800 dark:border-neutral-700">
            <CardContent className="p-3 pt-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
                  <Mail className="h-5 w-5 text-primary dark:text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Confirmation email sent to:</p>
                  <p className="font-semibold text-xs">{user?.email || "your email address"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please check your inbox and click the confirmation link. The link will expire in 30 minutes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground"
            size="sm"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});