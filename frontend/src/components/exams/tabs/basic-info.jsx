import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, AlertCircle } from "lucide-react";

export function BasicInfoTab({
  basicInfo,
  setBasicInfo,
  collections,
  collectionsLoading,
  collectionsError
}) {
  const handleChange = (field, value) => {
    setBasicInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Exam Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Exam Title *</Label>
            <Input
              id="title"
              value={basicInfo.examTitle}
              onChange={(e) => handleChange('examTitle', e.target.value)}
              placeholder="Enter exam title..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="collection">Question Collection *</Label>
            {collectionsError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load collections. Please refresh the page.
                </AlertDescription>
              </Alert>
            ) : (
              <Select 
                value={basicInfo.selectedCollection} 
                onValueChange={(value) => handleChange('selectedCollection', value)} 
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={collectionsLoading ? "Loading collections..." : "Select a question collection"} />
                </SelectTrigger>
                <SelectContent>
                  {collections.map(collection => (
                    <SelectItem key={collection.id} value={collection.id.toString()}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={basicInfo.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="600"
                value={basicInfo.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="120"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attempts">Max Attempts</Label>
              <Select 
                value={basicInfo.maxAttempts.toString()} 
                onValueChange={(value) => handleChange('maxAttempts', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 attempt</SelectItem>
                  <SelectItem value="2">2 attempts</SelectItem>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={basicInfo.passingScore}
                onChange={(e) => handleChange('passingScore', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
