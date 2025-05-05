import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function StatusAlerts({ saveError, errorMessage = "" }) {
  return (
    <>
      {saveError && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage || "There was an error saving your collection. Please try again."}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}