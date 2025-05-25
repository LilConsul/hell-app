import { CheckCircle, AlertTriangle } from "lucide-react";

export function FeedbackAlerts({ successMessage, errorMsg }) {
  return (
    <>
      {successMessage && (
        <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-medium transition-opacity duration-500">
          <CheckCircle className="h-4 w-4 mr-2" />
          {successMessage}
        </div>
      )}
      
      {errorMsg && (
        <div className="flex items-center justify-center p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium transition-opacity duration-500">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {errorMsg}
        </div>
      )}
    </>
  );
}