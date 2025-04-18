import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Exams from './pages/Exams'
import Students from './pages/Students'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Register from './pages/Register'
import { ThemeProvider } from './components/theme-provider'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/students" element={<Students />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </ThemeProvider>
  )
}
