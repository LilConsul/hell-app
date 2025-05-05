import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, Trash2, AlertTriangle } from "lucide-react"
import { cn, apiRequest } from "@/lib/utils"
import { Footer } from "@/components/footer"

export default function DeleteAccount() {
  // Detect and apply system color scheme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    // Initial check
    applyTheme(mediaQuery);
    // Listen for changes
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, []);

  const params = useParams()
  const navigate = useNavigate()
  const token = params.token

  // State variables for deletion flow
  const [status, setStatus] = useState("pending")
  const [errorMessage, setErrorMessage] = useState("")
  const [countdown, setCountdown] = useState(5)
  const requestedRef = useRef(false)

  // kick off deletion after countdown
  useEffect(() => {
    if (status !== "pending") return
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    doDelete()
  }, [countdown, status])

  // perform delete + logout
  async function doDelete() {
    if (requestedRef.current) return
    requestedRef.current = true

    setStatus("deleting")

    if (!token) {
      setStatus("error")
      setErrorMessage("Missing deletion token. Please retry from your email link.")
      return
    }

    try {
      await apiRequest("/api/v1/users/me", {
        method: "DELETE",
        credentials: "include",
        body: JSON.stringify({ token }),
      })

      // logout
      await apiRequest("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      setStatus("success")
      setTimeout(() => navigate("/"), 2000)
    } catch (err)  {
      console.error(err)
      setStatus("error")
      setErrorMessage(err.message || "Could not delete your account. Please try again.")
    }
  }

  const renderBody = () => {
    const iconBg = "rounded-full p-3"
    const box = "w-4/5 rounded-md p-4"

    switch (status) {
      case "pending":
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Delete Confirmation</CardTitle>
              <CardDescription>Your account will be deleted in {countdown} second{countdown !== 1 && "s"}…</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <div className={cn(iconBg, "bg-red-100 dark:bg-red-900/30")}>
                <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                disabled
              >
                Cancel
              </Button>
            </CardFooter>
          </>
        )

      case "deleting":
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Deleting Account…</CardTitle>
              <CardDescription>Please wait while we process your request.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <div className={cn(iconBg, "bg-red-100 dark:bg-red-900/30 animate-pulse")}>
                <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </>
        )

      case "success":
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-green-600 dark:text-green-400">Account Deleted</CardTitle>
              <CardDescription>Your account has been successfully deleted.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <div className={cn(iconBg, "bg-green-100 dark:bg-green-900/30")}>
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </>
        )

      case "error":
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-red-600 dark:text-red-400">Deletion Failed</CardTitle>
              <CardDescription>We couldn’t delete your account.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <div className={cn(iconBg, "bg-red-100 dark:bg-red-900/30")}>
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <Alert variant="destructive" className={cn(box, "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700")}>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-center space-x-2">
              <Button onClick={() => { setStatus("pending"); setCountdown(5); requestedRef.current = false }}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </CardFooter>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <Card className="relative border-2 mt-6">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 p-2 z-10">
              <Trash2 className="h-5 w-5 text-white" />
            </div>
            {renderBody()}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}