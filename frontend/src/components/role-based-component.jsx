import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

function RoleBasedComponent({ 
  studentComponent: StudentComponent, 
  teacherComponent: TeacherComponent,
  adminComponent: AdminComponent,
  fallback = "/dashboard",
  ...props 
}) {
  const { user } = useAuth();

  switch (user?.role) {
    case 'student':
      return StudentComponent ? <StudentComponent {...props} /> : <Navigate to={fallback} replace />;
    
    case 'teacher':
      return TeacherComponent ? <TeacherComponent {...props} /> : <Navigate to={fallback} replace />;
    
    case 'admin':
      // Admin can use admin-specific component or fall back to teacher component
      const AdminComp = AdminComponent || TeacherComponent;
      return AdminComp ? <AdminComp {...props} /> : <Navigate to={fallback} replace />;
    
    default:
      return <Navigate to={fallback} replace />;
  }
}

export default RoleBasedComponent;
