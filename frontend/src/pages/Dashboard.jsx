import StudentDashboard from "@/pages/student/Dashboard"
import { useAuth } from "@/contexts/auth-context";

function Dashboard() {
  const { user } = useAuth();

  if (user.role === 'teacher' || user.role === 'admin') {
    //student for now since teacher dashboard is on different branch
    return <StudentDashboard />;
  } else if (user.role === 'student') {
    return <StudentDashboard />;
  }
  //some error handling
  return <div>Unauthorized</div>;
}

export default Dashboard;
