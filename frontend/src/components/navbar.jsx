import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import { Link } from "react-router-dom"

export function Navbar() {
  return (
    <header className="border-b fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5" />
            <span>HellApp</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 ml-6">
            <Link to="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link to="/exams" className="text-sm font-medium hover:underline underline-offset-4">
              Exams
            </Link>
            <Link to="/students" className="text-sm font-medium hover:underline underline-offset-4">
              Students
            </Link>
            <Link to="/reports" className="text-sm font-medium hover:underline underline-offset-4">
              Reports
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Register</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
