import RoleBasedComponent from "@/components/role-based-component";
import StudentExams from "@/pages/student/exams/Exams";
import TeacherExams from "@/pages/teacher/exams/Exams";

export default function Exams() {
  return (
    <RoleBasedComponent
      studentComponent={StudentExams}
      teacherComponent={TeacherExams}
    />
  );
}
