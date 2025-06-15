import StudentDashboard from "@/pages/student/Dashboard"
import TeacherDashboard from "@/pages/teacher/Dashboard"
import RoleBasedComponent from "@/components/role-based-component";

export default function ExamDetails() {
  return (
    <RoleBasedComponent
      studentComponent={StudentDashboard}
      teacherComponent={TeacherDashboard}
    />
  );
}
