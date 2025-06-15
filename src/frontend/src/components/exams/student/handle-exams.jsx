import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  FileX,
  Filter
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";

// Loading state for exam details page
export function LoadingExamDetails() {
  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-32" /> {/* Back button */}
            <Skeleton className="h-6 w-24" /> {/* Status badge */}
          </div>
          
          <Skeleton className="h-8 w-3/4" /> {/* Title */}
        </div>

        {/* Info card skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" /> {/* Section title */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>

        {/* Attempts skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Error state for exam details
export function ErrorExamDetails({ error, retryAction }) {
  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load exam details. Please try again.
          </AlertDescription>
        </Alert>

        <Card className="text-center">
          <CardContent className="flex flex-col items-center space-y-6 py-12">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-semibold text-destructive">
                Something went wrong
              </h3>
              <p className="text-sm text-muted-foreground">
                {error || "An unexpected error occurred while loading the exam details."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={retryAction}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading state with shadcn Skeleton components
export function LoadingExams() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-9" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Empty state when no exams are found
export function EmptyExams() {
  return (
    <Card className="text-center">
      <CardContent className="flex flex-col items-center space-y-6 py-12">
        <div className="p-4 bg-muted rounded-full">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-semibold">No exams found</h3>
          <p className="text-sm text-muted-foreground">
            There are no exams matching your current criteria. Try adjusting your search or check back later.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Page
        </Button>
      </CardContent>
    </Card>
  );
}

// Error state with retry functionality using Alert component
export function ErrorExams({ error, retryAction }) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load exams. Please try again.</span>
        </AlertDescription>
      </Alert>

      <Card className="text-center">
        <CardContent className="flex flex-col items-center space-y-6 py-12">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2 max-w-sm">
            <h3 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground">
              {error || "An unexpected error occurred while loading your exams."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={retryAction}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Alternative empty state for when filters return no results
export function EmptyFilteredExams({ onClearFilters, activeFiltersCount = 0 }) {
  return (
    <Card className="text-center">
      <CardContent className="flex flex-col items-center space-y-6 py-12">
        <div className="p-4 bg-muted rounded-full">
          <Filter className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-3 max-w-sm">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-semibold">No matching exams</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            No exams match your current filters. Try adjusting your search criteria or clear filters to see all available exams.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Clear Filters
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExamConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  examTitle,
  isResuming = false,
  attemptsRemaining
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isResuming ? "Resume Exam" : "Start Exam"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {isResuming ? "resume" : "start"} <strong>{examTitle}</strong> exam?
            <br />
            <span className="font-medium">
              You have {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isResuming ? "Resume" : "Start"} Exam
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
