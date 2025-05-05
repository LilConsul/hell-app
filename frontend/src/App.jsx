import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { ProtectedRoute } from './components/protected-route';
import { AdminProvider } from "./contexts/admin-context.jsx";
import { AuthProvider } from './contexts/auth-context';

import Home from './pages/Home';
import Dashboard from './pages/teacher/Dashboard';
import Collections from './pages/teacher/collections/Collections';
import CreateCollection from './pages/teacher/collections/CreateCollection';
import Exams from './pages/Exams';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import EmailVerification from './pages/EmailVerification';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PasswordReset from './pages/PasswordReset';
import AdminPanel from "./pages/Admin-Panel.jsx";

function HomeWithLoginModal() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.openLoginModal) {
        window.openLoginModal();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return <Home />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<HomeWithLoginModal />} />
          <Route path="/verify/:token" element={<EmailVerification />} />
          <Route path="/password-reset/:token" element={<PasswordReset />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/exams" element={<ProtectedRoute element={<Exams />} />} />
          <Route path="/students" element={<ProtectedRoute element={<Students />} allowedRoles={['teacher', 'admin']} />} />
          <Route path="/reports" element={<ProtectedRoute element={<Reports />} allowedRoles={['teacher', 'admin']} />} />
          <Route path="/settings" element={<ProtectedRoute element={<Settings/>}/>}/>
          <Route path="/collections" element={<ProtectedRoute element={<Collections />} allowedRoles={['teacher', 'admin']} />} />
          <Route path="/collections/:collectionId" element={<ProtectedRoute element={<CreateCollection />} allowedRoles={['teacher', 'admin']} />} />

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
