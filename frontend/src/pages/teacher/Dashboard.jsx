import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Link } from "react-router-dom";
import { Book, CalendarDays, FileText, Users } from "lucide-react";

function TeacherDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Manage your tests, collections and students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/collections" className="w-full">
            <div className="border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <Book className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Test Collections</h2>
              <p className="text-muted-foreground mb-4">Manage your question collections</p>
              <Button className="mt-auto">View Collections</Button>
            </div>
          </Link>

          <Link to="/exams" className="w-full">
            <div className="border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Exams</h2>
              <p className="text-muted-foreground mb-4">Create and manage your exams</p>
              <Button className="mt-auto">View Exams</Button>
            </div>
          </Link>

          <Link to="/schedule" className="w-full">
            <div className="border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Schedule</h2>
              <p className="text-muted-foreground mb-4">View upcoming exams and events</p>
              <Button className="mt-auto">View Schedule</Button>
            </div>
          </Link>

          <Link to="/students" className="w-full">
            <div className="border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Students</h2>
              <p className="text-muted-foreground mb-4">Manage students and their results</p>
              <Button className="mt-auto">View Students</Button>
            </div>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default TeacherDashboard;