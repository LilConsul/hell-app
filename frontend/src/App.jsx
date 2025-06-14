import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './contexts/auth-context';
import { AdminProvider } from './contexts/admin-context';
import { ProtectedLayout } from './components/protected-layout';

// Regualr pages
import Home from './pages/regular/Home';
import Settings from './pages/regular/Settings'; 
import PrivacyPolicy from './pages/regular/PrivacyPolicy';
import NotFoundPage from './pages/regular/NotFoundPage';
import DeleteAccount from './pages/regular/DeleteAccount';
import PasswordReset from './pages/regular/PasswordReset';
import EmailVerification from './pages/regular/EmailVerification';

// Pages based on user role
import Dashboard  from './pages/role-based/DashboardDecider';
import Exams from './pages/role-based/ExamDecider';
import ExamDetails from './pages/role-based/ExamDetailsDecider';

// Teacher pages
import Collections from './pages/teacher/collections/Collections';
import CreateCollection from './pages/teacher/collections/CreateCollection';
import AllExams from './pages/teacher/exams/AllExams';

// Student pages
import StudentExamResults from './pages/student/exams/Results.jsx';

// Placeholders
import Students from './pages/Students';
import Reports from './pages/Reports';

// Admin pages
import AdminPanel from './pages/admin/Admin-Panel.jsx';



function HomeWithLoginModal() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.openLoginModal) window.openLoginModal();
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
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<HomeWithLoginModal />} />
          <Route path="/verify/:token" element={<EmailVerification />} />
          <Route path="/password-reset/:token" element={<PasswordReset />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/delete-account/:token" element={<DeleteAccount />} />
          <Route path="*" element={<NotFoundPage />} />

          {/* All authenticated users */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exams" element={<Exams/>} />
            <Route path="/exams/:examId" element={<ExamDetails />} />
            <Route path="/exams/:examId/results" element={<StudentExamResults />} />

            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Teacher & Admin */}
          <Route element={<ProtectedLayout allowedRoles={['teacher', 'admin']} />}>
            <Route path="/students" element={<Students />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:collectionId" element={<CreateCollection />} />
            <Route path="/all-exams" element={<AllExams />} />
          </Route>

        {/* Admin only */}
          <Route element={<ProtectedLayout allowedRoles={['admin']} />}>
            <Route
              path="/admin"
              element={
                <AdminProvider>
                  <AdminPanel />
                </AdminProvider>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

