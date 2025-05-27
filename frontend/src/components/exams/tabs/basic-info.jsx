import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, AlertCircle, Calendar, Clock } from "lucide-react";
import { DateTimePicker24h } from "@/components/date-time-picker";
import { ValueSelector } from "@/components/value-selector";
import { useNavigate } from "react-router-dom";

export function BasicInfoTab({
  basicInfo,
  setBasicInfo,
  collections,
  collectionsLoading,
  collectionsError
}) {
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setBasicInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Exam Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Exam Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={basicInfo.examTitle}
              onChange={(e) => handleChange('examTitle', e.target.value)}
              placeholder="Enter exam title..."
              className="w-full"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="collection">
              Question Collection <span className="text-destructive">*</span>
            </Label>
            {collectionsError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load collections. Please refresh the page.
                </AlertDescription>
              </Alert>
            ) : collections && collections.length === 0 ? (
              <div className="space-y-3">
                <Select disabled>
                  <SelectTrigger className="w-full opacity-50 cursor-not-allowed">
                    <SelectValue placeholder="No collections available" />
                  </SelectTrigger>
                </Select>
                <Alert 
                  className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 border-dashed"
                  onClick={() => navigate('/collections/new')}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm leading-relaxed">
                      You don't have access to any question collections. To create an exam, you'll need at least one collection with questions.
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 font-medium">
                      Click here to create a new collection →
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Select 
                value={basicInfo.selectedCollection} 
                onValueChange={(value) => handleChange('selectedCollection', value)} 
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={collectionsLoading ? "Loading collections..." : "Select a question collection"} />
                </SelectTrigger>
                <SelectContent>
                  {collections.map(collection => (
                    <SelectItem 
                      key={collection.id} 
                      value={collection.id.toString()}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{collection.title}</span>
                        <Badge variant="secondary" className="ml-2">
                          {collection.question_count} questions
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date & Time <span className="text-destructive">*</span>
              </Label>
              <DateTimePicker24h
                value={basicInfo.startDate}
                onChange={(date) => handleChange('startDate', date)}
                placeholder="Select start date and time..."
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration (minutes) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="600"
                value={basicInfo.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="120"
                className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="passingScore">
                Passing Score (%)
              </Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={basicInfo.passingScore}
                onChange={(e) => handleChange('passingScore', parseInt(e.target.value) || 0)}
                placeholder="60"
                className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attempts">
                Max Attempts
              </Label>
              <ValueSelector
                id="attempts"
                value={basicInfo.maxAttempts}
                onChange={(value) => handleChange('maxAttempts', value)}
                customTitle="Max Attempts"
                unitLabel="attempt"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
