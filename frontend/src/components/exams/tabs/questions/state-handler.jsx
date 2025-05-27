import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, AlertCircle, ExternalLink } from "lucide-react";

export function QuestionsStateHandler({ 
  state, 
  selectedCollection
}) {
  // No collection selected
  if (state === "no-collection") {
    return (
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Questions Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Collection Selected</h3>
            <p>Please select a question collection from the Basic Info tab to preview questions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (state === "loading") {
    return (
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Questions Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <div className="flex gap-2 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Questions Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load collection questions. Please try selecting a different collection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // No questions in collection
  if (state === "no-questions") {
    return (
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Questions Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Questions Available</h3>
            <p className="mb-4">This collection doesn't contain any questions yet.</p>
            <Button variant="outline" asChild>
              <a 
                href={`/collections/${selectedCollection}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Open Collection
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If none of the above states match, return null (shouldn't happen)
  return null;
}
