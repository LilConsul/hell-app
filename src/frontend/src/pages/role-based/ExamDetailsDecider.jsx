import RoleBasedComponent from "@/components/role-based-component";
import StudentExamDetails from "@/pages/student/exams/ExamDetails";
import CreateExam from "@/pages/teacher/exams/CreateExam";

export default function ExamDetails() {
  return (
    <RoleBasedComponent
      studentComponent={StudentExamDetails}
      teacherComponent={CreateExam}
    />
  );
}
