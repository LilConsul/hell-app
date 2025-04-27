import {Route, Routes} from 'react-router-dom';
import {ThemeProvider} from './components/theme-provider';
import {AuthProvider} from './contexts/auth-context';
import {ProtectedRoute} from './components/protected-route';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminPanel from "./pages/Admin-Panel.jsx";
import {AdminProvider} from "./contexts/admin-context.jsx";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home/>}/>

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard/>}/>}/>
          <Route path="/exams" element={<ProtectedRoute element={<Exams/>}/>}/>
          <Route path="/students"
                 element={<ProtectedRoute element={<Students/>} allowedRoles={['teacher', 'admin']}/>}/>
          <Route path="/reports" element={<ProtectedRoute element={<Reports/>} allowedRoles={['teacher', 'admin']}/>}/>
          <Route path="/settings" element={<ProtectedRoute element={<Settings/>}/>}/>

          {/*Admin routes*/}

          <Route path="/admin" element={<ProtectedRoute element={
            <AdminProvider>
              <AdminPanel/>
            </AdminProvider>
          } allowedRoles={['admin']}/>}/>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
