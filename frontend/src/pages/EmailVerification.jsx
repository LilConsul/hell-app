
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Loader2, Mail } from "lucide-react"

export default function EmailVerification() {
  const params = useParams()
  const navigate = useNavigate()
  const [verificationState, setVerificationState] = useState("loading")
  const [errorMessage, setErrorMessage] = useState("")

  const openLoginModal = () => {
    navigate("/");
    setTimeout(() => {
      if (window.openLoginModal) {
        window.openLoginModal();
      }
    }, 100);
  };

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = params.token
        
        if (!token) {
          setVerificationState("error")
          setErrorMessage("No verification token provided.")
          return
        }

        const response = await fetch('/api/v1/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setVerificationState("success")
          setTimeout(() => {
            openLoginModal()
          }, 5000)
        } else {
          setVerificationState("error")
            
          if (data.detail === "User is already verified") {
            setErrorMessage("Your email is already verified. Redirecting you to login.")
            setTimeout(() => {
              openLoginModal()
            }, 20000)
          } else if (data.detail === "Invalid or expired verification token") {
            setErrorMessage("The verification link has expired or is invalid. Please request a new one.")
          } else {
            setErrorMessage(data.detail || "Verification failed. Please try again later.")
          }
        }
      } catch (error) {
        setVerificationState("error")
        setErrorMessage("An unexpected error occurred. Please try again later.")
        console.error("Verification error:", error)
      }
    }

    verifyEmail()
  }, [params.token, navigate])

  const renderContent = () => {
    switch (verificationState) {
      case "loading":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-xl text-center">Verifying Your Email</CardTitle>
              <CardDescription className="text-center">
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">This will only take a moment</p>
            </CardContent>
          </>
        )
  
      case "success":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-xl text-center text-green-600">Email Verified!</CardTitle>
              <CardDescription className="text-center">Your email has been successfully verified.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <p className="text-center mb-6">
                Thank you for verifying your email address. Your account is now fully activated.
              </p>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Verification Complete</AlertTitle>
                <AlertDescription>Redirecting you to the login page...</AlertDescription>
              </Alert>
            </CardContent>
          </>
        )
  
      case "error":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-xl text-center text-red-600">Verification Failed</CardTitle>
              <CardDescription className="text-center">
                We encountered an issue while verifying your email.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <p className="text-center mb-6">{errorMessage || "The verification link appears to be invalid."}</p>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Verification Error</AlertTitle>
                <AlertDescription>Please contact support if you need assistance.</AlertDescription>
              </Alert>
            </CardContent>
          </>
        )
  
      default:
        return null
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <Card className="border-2 relative mt-6">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary p-2 z-10">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>
            {renderContent()}
          </Card>
        </div>
      </main>
  
      <footer className="border-t py-4 w-full">
        <div className="container mx-auto text-center text-sm text-muted-foreground"> 
          <p>© 2025 SecureExam. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}