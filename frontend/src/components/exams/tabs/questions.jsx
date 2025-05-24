import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, AlertCircle, Clock, HelpCircle } from "lucide-react";
import collectionAPI from "@/pages/teacher/collections/Collections.api";

export function QuestionsTab({ selectedCollection }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedCollection) {
      loadCollection();
    } else {
      setCollection(null);
      setError(null);
    }
  }, [selectedCollection]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await collectionAPI.getCollection(selectedCollection);
      setCollection(data);
    } catch (error) {
      console.error("Failed to load collection:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice':
        return <HelpCircle className="h-4 w-4" />;
      case 'true_false':
        return <Clock className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getQuestionTypeName = (type) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True/False';
      case 'short_answer':
        return 'Short Answer';
      case 'essay':
        return 'Essay';
      default:
        return type;
    }
  };

  if (!selectedCollection) {
    return (
      <Card>
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Questions Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {collection?.title || 'Collection Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collection?.description && (
            <p className="text-muted-foreground mb-4">{collection.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Total Questions</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {collection?.questions?.length || 0}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-medium">Est. Duration</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {Math.ceil((collection?.questions?.length || 0) * 1.5)} min
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Question Types</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(collection?.questions?.map(q => q.type) || []).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {collection?.questions && collection.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collection.questions.map((question, index) => (
                <div key={question.id || index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getQuestionTypeIcon(question.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {index + 1}. {question.question || question.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getQuestionTypeName(question.type)}
                        </Badge>
                        {question.points && (
                          <Badge variant="secondary" className="text-xs">
                            {question.points} pts
                          </Badge>
                        )}
                        {question.difficulty && (
                          <Badge 
                            variant={question.difficulty === 'hard' ? 'destructive' : question.difficulty === 'medium' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {question.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}