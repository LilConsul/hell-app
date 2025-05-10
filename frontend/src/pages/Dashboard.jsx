import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Shield, LogOut, User } from "lucide-react"
import StudentDashboard from "@/pages/student/Dashboard"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth()
  const [userContent, setUserContent] = useState({
    activities: []
  })
  const [contentLoading, setContentLoading] = useState(false)


  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const renderDashboardContent = () => {
    if (user && user.role) {
      if (user.role === 'student' || user.role === 'teacher' || user.role === 'admin') {
        return <StudentDashboard user={user} userContent={userContent} contentLoading={contentLoading} handleLogout={handleLogout} />
      }
      
      return (
        <div className="container max-w-6xl mx-auto p-4 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-2">Unknown User Role</h1>
          <p className="text-muted-foreground mb-6">
            Your account type "{user.role}" is not recognized. Please contact support.
          </p>
        </div>
      )
    }

    return (
      <div className="container max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user?.first_name}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contentLoading ? (
            <div className="col-span-3 py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          ) : (
            <>
              <div className="bg-card rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-2">
                  {userContent?.activities?.length ? (
                    userContent.activities.map((activity, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        {activity.description}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No recent activity found.</p>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Account Status</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Member since:</span>
                    <span className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    View Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Account Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Help Center
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access your dashboard.
            </p>
            <div className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => window.openLoginModal?.()}
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.openRegisterModal?.()}
              >
                Create Account
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {renderDashboardContent()}
      </main>
      <Footer />
    </div>
  )
}
