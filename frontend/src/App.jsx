import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './contexts/auth-context';
import { AdminProvider } from './contexts/admin-context';
import { ProtectedLayout } from './components/protected-layout';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import EmailVerification from './pages/EmailVerification';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PasswordReset from './pages/PasswordReset';
import DeleteAccount from "./pages/DeleteAccount";
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
          <Route path="/delete-account/:token" element={<DeleteAccount />} />

          {/* Standard protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Teacher/Admin only routes */}
          <Route element={<ProtectedLayout allowedRoles={['teacher', 'admin']} />}>
            <Route path="/students" element={<Students />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Admin only routes */}
          <Route element={<ProtectedLayout allowedRoles={['admin']} />}>
            <Route path="/admin" element={
              <AdminProvider>
                <AdminPanel />
              </AdminProvider>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}