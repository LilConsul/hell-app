import { useAuth } from "@/contexts/auth-context";

import StudentExams from "@/pages/student/exams/StudentExams"
import TeacherExams from "@/pages/teacher/exams/Exams"

function Exams() {
  const { user } = useAuth();

  if (user.role === 'teacher' || user.role === 'admin') {
    return <TeacherExams/>;
  } else if (user.role === 'student') {
    return <StudentExams/>;
  }
  //some error handling
  // e.g. redirect to 404 page
  // or sth like that
  return <div>Unauthorized</div>;
}

export default Exams;
