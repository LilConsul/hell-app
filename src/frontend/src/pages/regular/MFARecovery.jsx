import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Loader2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";

function MFARecoveryPage() {
  const { token } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const { confirmMFARecovery } = useAuth();

  useEffect(() => {
    const submitRecoveryToken = async () => {
      setIsLoading(true);
      setError("");

      try {
        await confirmMFARecovery(token);
        setIsSuccess(true);
      } catch (error) {
        setError(error.message || "An error occurred while disabling 2FA. The link may have expired. Please try requesting a new recovery code.");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      submitRecoveryToken();
    } else {
      setError("Missing recovery token. Invalid link.");
      setIsLoading(false);
    }
  }, [token, confirmMFARecovery]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="border rounded-lg">
              <CardHeader className="pt-8">
                <CardTitle className="text-xl text-center">Processing Recovery Request</CardTitle>
                <CardDescription className="text-center">Please wait while we verify your recovery link...</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  This may take a few moments
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="border rounded-lg relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500 p-2">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-xl text-center text-green-600">2FA Disabled Successfully</CardTitle>
                <CardDescription className="text-center">Your two-factor authentication has been disabled</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-center mb-6">
                  Your two-factor authentication has been successfully disabled. You can now log in without requiring an authenticator code.
                </p>
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>You can now login without 2FA</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild>
                  <Link to="/login">Go to Login</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border rounded-lg relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive p-2">
              <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl text-center">Recovery Failed</CardTitle>
              <CardDescription className="text-center">Could not disable two-factor authentication</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-destructive/10 p-3 mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 w-full">
              <Button asChild className="w-full">
                <Link to="/login">Back to Login</Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Got your authenticator working again? <Link to="/login" className="text-primary hover:underline">Try logging in normally</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}

export default MFARecoveryPage;
