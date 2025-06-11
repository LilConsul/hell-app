import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function FeedbackAlerts({ successMessage, errorMsg }) {
  return (
    <>
      {successMessage && (
        <Alert className={cn(
          "border-emerald-500 bg-emerald-50/50 text-emerald-800",
          "dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
        )}>
          <CheckCircle className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert className={cn(
          "border-red-500 bg-red-50/50 text-red-800",
          "dark:border-red-700 dark:bg-red-950/20 dark:text-red-300"
        )}>
          <AlertTriangle className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
          <AlertDescription className="font-medium">
            {errorMsg}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

export { FeedbackAlerts };