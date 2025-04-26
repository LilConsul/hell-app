import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { useEffect } from 'react';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import EmailVerification from './pages/EmailVerification';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PasswordReset from './pages/PasswordReset';

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
          <Route path="/settings"  element={<Settings />}  />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/exams" element={<ProtectedRoute element={<Exams />} />} />
          <Route path="/students" element={<ProtectedRoute element={<Students />} allowedRoles={['teacher', 'admin']} />} />
          <Route path="/reports" element={<ProtectedRoute element={<Reports />} allowedRoles={['teacher', 'admin']} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
