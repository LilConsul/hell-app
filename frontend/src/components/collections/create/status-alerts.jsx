import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Archive } from "lucide-react";

export function StatusAlerts({ 
  error = false, 
  errorMessage = "There was an error. Please try again.",
  className = "my-4",
  status = null
}) {
  if (!error && status !== "archived") {
    return null;
  }
  
  return (
    <div className={className}>
      {error && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 mb-3">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
      {status === "archived" && (
        <Alert className="bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700">
          <Archive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <AlertDescription>
            This collection is archived. You'll need to restore it to draft status before making changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}