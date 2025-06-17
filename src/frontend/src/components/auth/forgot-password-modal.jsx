import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, ArrowLeft, CheckCircle } from "lucide-react"
import { createPortal } from "react-dom"
import HellAppLogo from "../hell-app-logo"

export function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const [serverError, setServerError] = useState(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)

    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setServerError(null)
      setIsSubmitted(false)
    } else {
      setEmail("")
      setServerError(null)
      setIsSubmitted(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setServerError(null)
    
    try {
      const response = await fetch('/api/v1/auth/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const result = await response.json()

      if (!response.ok) {
        setServerError(result.detail[0].msg || "An error occurred. Please try again.")
      } else {
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error("Password reset request failed:", error)
      setServerError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-auto p-6">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        <div className="space-y-6">
          {!isSubmitted ? (
            <>
              <div className="space-y-2 text-center">
                <div className="flex justify-center">
                  <HellAppLogo className="h-8 w-8 mb-2" />
                </div>
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>
              
              {serverError && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                  {serverError}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center"
                  type="button"
                  onClick={onBackToLogin}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Check your email</h1>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <span className="font-medium">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
              <div className="space-y-2">
                <Button className="w-full" onClick={onClose}>
                  Close
                </Button>
                <Button variant="outline" className="w-full" onClick={onBackToLogin}>
                  Back to login
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
