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
import { Trash2, Check } from "lucide-react"
import { cn, apiRequest } from "@/lib/utils"
import { Footer } from "@/components/footer"

export default function DeleteAccount() {
  const params = useParams()
  const navigate = useNavigate()
  const token = params.token

  const [status, setStatus] = useState("pending")
  const [errorMessage, setErrorMessage] = useState("")
  const [countdown, setCountdown] = useState(5)
  const requestedRef = useRef(false)

  useEffect(() => {
    if (status !== "pending") return
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    doDelete()
  }, [countdown, status])

  async function doDelete() {
    if (requestedRef.current) return
    requestedRef.current = true
    setStatus("deleting")

    try {
      await apiRequest("/api/v1/users/me", {
        method: "DELETE",
        body: JSON.stringify({ token }),
      })
      await apiRequest("/api/v1/auth/logout", {
        method: "POST",
      })
      setStatus("success")
      setTimeout(() => window.location.href = "/", 2000)
    } catch (err) {
      console.error(err)
      setStatus("error")
      setErrorMessage(err.message || "Could not delete your account. Please try again.")
    }
  }

  const renderBody = () => {
    const box = "w-4/5 rounded-md p-4"
    const titleClass = "text-xl font-semibold"
    const descClass = "text-base text-gray-300 dark:text-gray-400"
    const paraClass = "mt-2 text-base text-center text-gray-600 dark:text-gray-400"

    switch (status) {
      case "pending":
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className={titleClass}>Delete Confirmation</CardTitle>
              <CardDescription className={descClass}>
                Your account will be deleted in {countdown} second{countdown !== 1 && "s"}…
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <p className={paraClass}>
                This action is irreversible. Please back up any important data before your account is permanently removed.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
            </CardFooter>
          </>
        )

      case "deleting":
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className={titleClass}>Deleting Account…</CardTitle>
              <CardDescription className={descClass}>
                Processing your request.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <p className={paraClass}>
                This may take a few moments. Thank you for your patience.
              </p>
            </CardContent>
          </>
        )

      case "success":
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className={titleClass + " text-red-600 dark:text-red-400"}>
                Account Deleted
              </CardTitle>
              <CardDescription className={descClass}>
                Your account has been successfully deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="bg-red-900/30 p-4 rounded-full">
                <Check className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </>
        )

      case "error":
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className={titleClass + " text-red-600 dark:text-red-400"}>
                Deletion Failed
              </CardTitle>
              <CardDescription className={descClass}>
                We couldn't delete your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <Alert variant="destructive" className={cn(box, "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700")}>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <p className={paraClass}>
                If the issue persists, please contact support for assistance.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center space-x-2">
              <Button onClick={() => { setStatus("pending"); setCountdown(5); requestedRef.current = false }}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
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
        <div className="w-full max-w-lg relative">
          {/* Top trash icon overlay with updated design */}
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900/30 p-3 rounded-full">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <Card className="mt-12">
            {renderBody()}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}