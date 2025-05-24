import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  X,
  Search,
  Loader2,
  UserPlus,
  UserMinus
} from "lucide-react";
import { CustomPagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";

export function StudentsTab({ 
  selectedStudents, 
  onStudentsChange, 
  students = [], 
  loading = false,
  error = null 
}) {
  const [searchStudents, setSearchStudents] = useState("");

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const search = searchStudents.toLowerCase();
    return fullName.includes(search) || student.email.toLowerCase().includes(search);
  });

  // Pagination setup - 20 students per page
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedStudents,
    goToPage
  } = usePagination(filteredStudents, 20, {
    scrollToRef: "#students-list" // Will scroll to students list container
  });

  // Reset to first page when search changes
  useEffect(() => {
    goToPage(1);
  }, [searchStudents, goToPage]);

  const handleStudentToggle = (student) => {
    const exists = selectedStudents.find(s => s.id === student.id);
    if (exists) {
      onStudentsChange(selectedStudents.filter(s => s.id !== student.id));
    } else {
      onStudentsChange([...selectedStudents, student]);
    }
  };

  const removeStudent = (studentId) => {
    onStudentsChange(selectedStudents.filter(s => s.id !== studentId));
  };

  const selectAllFiltered = () => {
    const newStudents = [...selectedStudents];
    filteredStudents.forEach(student => {
      if (!newStudents.find(s => s.id === student.id)) {
        newStudents.push(student);
      }
    });
    onStudentsChange(newStudents);
  };

  const deselectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    onStudentsChange(selectedStudents.filter(s => !filteredIds.includes(s.id)));
  };

  const selectAllCurrentPage = () => {
    const newStudents = [...selectedStudents];
    paginatedStudents.forEach(student => {
      if (!newStudents.find(s => s.id === student.id)) {
        newStudents.push(student);
      }
    });
    onStudentsChange(newStudents);
  };

  const deselectAllCurrentPage = () => {
    const currentPageIds = paginatedStudents.map(s => s.id);
    onStudentsChange(selectedStudents.filter(s => !currentPageIds.includes(s.id)));
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Users className="h-5 w-5" />
            Error Loading Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Failed to load students: {error.message || 'Unknown error'}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assign Students
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Bulk Actions */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="studentSearch">Search Students</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="studentSearch"
                value={searchStudents}
                onChange={(e) => setSearchStudents(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Bulk Selection Actions */}
          {filteredStudents.length > 0 && !loading && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllFiltered}
                className="flex items-center gap-1"
              >
                <UserPlus className="h-3 w-3" />
                Select All Results ({filteredStudents.length})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllCurrentPage}
                className="flex items-center gap-1"
                disabled={paginatedStudents.length === 0}
              >
                <UserPlus className="h-3 w-3" />
                Select Page ({paginatedStudents.length})
              </Button>
              {selectedStudents.length > 0 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAllFiltered}
                    className="flex items-center gap-1"
                  >
                    <UserMinus className="h-3 w-3" />
                    Deselect All Results
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAllCurrentPage}
                    className="flex items-center gap-1"
                  >
                    <UserMinus className="h-3 w-3" />
                    Deselect Page
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Selected Students */}
        {selectedStudents.length > 0 && (
          <div>
            <Label>Selected Students ({selectedStudents.length})</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedStudents.map(student => (
                <Badge key={student.id} variant="secondary" className="pr-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {student.first_name?.[0]?.toUpperCase()}{student.last_name?.[0]?.toUpperCase()}
                    </div>
                    <span>{student.first_name} {student.last_name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeStudent(student.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Students List */}
        <div id="students-list" className="overflow-y-auto border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchStudents ? (
                <>
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No students found matching "{searchStudents}"</p>
                </>
              ) : (
                <>
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No students available</p>
                </>
              )}
            </div>
          ) : (
            paginatedStudents.map(student => (
              <div
                key={student.id}
                className="flex items-center space-x-3 p-3 hover:bg-muted/50 border-b last:border-b-0 cursor-pointer transition-colors"
                onClick={() => handleStudentToggle(student)}
              >
                <Checkbox
                  checked={selectedStudents.some(s => s.id === student.id)}
                  onCheckedChange={() => handleStudentToggle(student)}
                  onClick={(e) => e.stopPropagation()} // Prevent double toggle
                />
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                  {student.first_name?.[0]?.toUpperCase()}{student.last_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{student.first_name} {student.last_name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredStudents.length > 0 && totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        )}

        {/* Summary */}
        {!loading && students.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredStudents.length > 0 ? (
              <>
                Showing {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, filteredStudents.length)} of {filteredStudents.length} students
                {filteredStudents.length !== students.length && ` (filtered from ${students.length})`}
              </>
            ) : (
              `Showing 0 of ${students.length} students`
            )}
            {selectedStudents.length > 0 && (
              <span className="ml-2 font-medium text-foreground">
                • {selectedStudents.length} selected
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}