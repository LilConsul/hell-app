import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker24h } from "@/components/date-time-picker";
import { Calendar, Clock, Users, Download } from "lucide-react";
import examAPI from "@/pages/teacher/exams/Exam.api";
import { toast } from "sonner";

export function PDFReportModal({ 
  open, 
  onOpenChange, 
  examId, 
  selectedStudents = [] 
}) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    student_ids: [],
    only_last_attempt: true,
    include_visualizations: true
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentToggle = (studentId, checked) => {
    setFilters(prev => ({
      ...prev,
      student_ids: checked 
        ? [...prev.student_ids, studentId]
        : prev.student_ids.filter(id => id !== studentId)
    }));
  };

  const handleSelectAllStudents = (checked) => {
    setFilters(prev => ({
      ...prev,
      student_ids: checked ? selectedStudents.map(s => s.id) : []
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const params = {};
      
      if (filters.start_date) {
        params.start_date = filters.start_date;
      }
      
      if (filters.end_date) {
        params.end_date = filters.end_date;
      }
      
      if (filters.student_ids.length > 0) {
        params.student_ids = filters.student_ids.join(',');
      }
      
      params.only_last_attempt = filters.only_last_attempt;
      params.include_visualizations = filters.include_visualizations;

      const response = await examAPI.exportExamReportPDF(examId, params);
      
      if (response.data && response.data.download_url) {
        const link = document.createElement('a');
        link.href = response.data.download_url;
        link.download = `exam-report-${examId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("PDF report downloaded successfully!", {
          description: "The download should start automatically."
        });
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to download PDF report:", error);
      toast.error("Failed to download PDF report", {
        description: error.message || "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  const isAllStudentsSelected = selectedStudents.length > 0 && 
    filters.student_ids.length === selectedStudents.length;
  
  const isSomeStudentsSelected = filters.student_ids.length > 0 && 
    filters.student_ids.length < selectedStudents.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download PDF Report
          </DialogTitle>
          <DialogDescription>
            Configure the filters for your exam report. Leave fields empty to include all data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date & Time
                {!filters.start_date && (
                  <span className="text-xs text-muted-foreground ml-auto">(All dates)</span>
                )}
              </Label>
              <DateTimePicker24h
                value={filters.start_date}
                onChange={(date) => handleFilterChange('start_date', date)}
                placeholder="Filter from date..."
                className={`w-full ${!filters.start_date ? 'border-dashed border-muted-foreground/30' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Date & Time
                {!filters.end_date && (
                  <span className="text-xs text-muted-foreground ml-auto">(All dates)</span>
                )}
              </Label>
              <DateTimePicker24h
                value={filters.end_date}
                onChange={(date) => handleFilterChange('end_date', date)}
                placeholder="Filter until date..."
                className={`w-full ${!filters.end_date ? 'border-dashed border-muted-foreground/30' : ''}`}
              />
            </div>
          </div>

          {selectedStudents.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students
              </Label>
              
              <div className="border rounded-lg p-3 space-y-3 max-h-48 overflow-y-auto">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    id="select-all"
                    checked={isAllStudentsSelected}
                    onCheckedChange={handleSelectAllStudents}
                    className="cursor-pointer"
                    ref={(ref) => {
                      if (ref) ref.indeterminate = isSomeStudentsSelected;
                    }}
                  />
                  <Label htmlFor="select-all" className="font-medium cursor-pointer">
                    {isAllStudentsSelected 
                      ? "Deselect All" 
                      : isSomeStudentsSelected 
                      ? "Select All" 
                      : "Select All"}
                  </Label>
                </div>
                
                <div className="border-t pt-2 space-y-2">
                  {selectedStudents.map(student => (
                    <div key={student.id} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={filters.student_ids.includes(student.id)}
                        onCheckedChange={(checked) => handleStudentToggle(student.id, checked)}
                        className="cursor-pointer"
                      />
                      <Label 
                        htmlFor={`student-${student.id}`} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {student.name || `${student.first_name} ${student.last_name}`}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {filters.student_ids.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No students selected. All assigned students will be included in the report.
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="only-last-attempt"
                checked={filters.only_last_attempt}
                onCheckedChange={(checked) => handleFilterChange('only_last_attempt', checked)}
                className="cursor-pointer"
              />
              <Label htmlFor="only-last-attempt" className="text-sm font-normal cursor-pointer">
                Only include last attempt per student
              </Label>
            </div>

            <div className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="include-visualizations"
                checked={filters.include_visualizations}
                onCheckedChange={(checked) => handleFilterChange('include_visualizations', checked)}
                className="cursor-pointer"
              />
              <Label htmlFor="include-visualizations" className="text-sm font-normal cursor-pointer">
                Include visualizations and charts
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Downloading..." : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}