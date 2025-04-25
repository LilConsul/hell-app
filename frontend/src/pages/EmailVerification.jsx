import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, Loader2, Mail, ArrowRight } from "lucide-react"

const verificationCache = {};

function EmailVerification() {
  const params = useParams()
  const navigate = useNavigate()
  const [verificationState, setVerificationState] = useState("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const requestSentRef = useRef(false)
  
  const navigateToLogin = () => {
    navigate("/login");
  };

  useEffect(() => {
    const token = params.token;
    
    if (!token) {
      setVerificationState("error");
      setErrorMessage("No verification token provided.");
      return;
    }
    
    if (verificationCache[token]) {
      setVerificationState(verificationCache[token].state);
      if (verificationCache[token].errorMessage) {
        setErrorMessage(verificationCache[token].errorMessage);
      }
      return;
    }
    
    // Avoid sending 2nd request
    if (requestSentRef.current) {
      return;
    }
    
    requestSentRef.current = true;
    
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/v1/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
                
        const data = await response.json();
        
        let result = { state: "error", errorMessage: "" };
        
        if (response.ok) {
          result.state = "success";
          setVerificationState("success");
        } else {
          if (data.detail === "User is already verified") {
            result.state = "already-verified";
            setVerificationState("already-verified");
          } else if (data.detail === "Invalid or expired verification token") {
            result.errorMessage = "The verification link has expired or is invalid. Please request a new one.";
            setVerificationState("error");
            setErrorMessage(result.errorMessage);
          } else {
            result.errorMessage = data.detail || "Verification failed. Please try again later.";
            setVerificationState("error");
            setErrorMessage(result.errorMessage);
          }
        }
        
        verificationCache[token] = result;
        
      } catch (error) {
        const result = {
          state: "error",
          errorMessage: "An unexpected error occurred. Please try again later."
        };
        setVerificationState(result.state);
        setErrorMessage(result.errorMessage);
        
        verificationCache[token] = result;
      }
    };

    verifyEmail();
    
  }, [params.token]);

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
                <AlertDescription>Your account is now active.</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={navigateToLogin}>
                Continue to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )
      
      case "already-verified":
        return (
          <>
            <CardHeader>
              <CardTitle className="text-xl text-center text-blue-600">Already Verified</CardTitle>
              <CardDescription className="text-center">Your email has already been verified.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-blue-100 p-3 mb-4">
                <CheckCircle className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-center mb-6">
                It looks like you've already verified your email address. No further action is needed.
              </p>
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle>Already Verified</AlertTitle>
                <AlertDescription>Your account is active and you can access all features.</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={navigateToLogin}>
                Continue to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
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
            <CardFooter className="flex justify-center">
              <Button onClick={navigateToLogin}>
                Return to Home <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
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

export default EmailVerification;