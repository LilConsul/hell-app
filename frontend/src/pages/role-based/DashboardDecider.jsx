import { useAuth } from "@/contexts/auth-context";

import StudentDashboard from "@/pages/student/Dashboard"
import TeacherDashboard from "@/pages/teacher/Dashboard"

function Dashboard() {
  const { user } = useAuth();

  if (user.role === 'teacher' || user.role === 'admin') {
    return <TeacherDashboard/>;
  } else if (user.role === 'student') {
    return <StudentDashboard />;
  }
  //some error handling
  // e.g. redirect to 404 page
  // or sth like that
  return <div>Unauthorized</div>;
}

export default Dashboard;
