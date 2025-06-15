import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function ExamLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading exam...</p>
      </div>
    </div>
  );
}

export function ExamErrorAlert({ error }) {
  if (!error) return null;
  
  return (
    <div className="container mx-auto px-4 py-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  );
}

export function TabSwitchWarning({ tabSwitchCount, securitySettings }) {
  if (!securitySettings?.prevent_tab_switching || tabSwitchCount === 0) return null;
  
  return (
    <div className="container mx-auto px-4 py-2">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Warning: Tab switching detected ({tabSwitchCount} times). Please stay on this page.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function InitialErrorAlert({ error }) {
  if (!error) return null;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  );
}