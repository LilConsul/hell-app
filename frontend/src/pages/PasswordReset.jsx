import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Loader2, Lock, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/footer";

import { PasswordInput } from "@/components/password/password-input";
import { PasswordRequirements } from "@/components/password/password-requirements";
import { usePasswordValidation } from "@/components/password/password-validation";

function PasswordResetPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const { 
    passwordErrors, 
    showRequirements, 
    isPasswordValid,
    passwordRegex
  } = usePasswordValidation(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet all requirements");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          token,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError("An error occurred while resetting your password. Please try again.");
    }
  };

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
                <CardTitle className="text-xl text-center text-green-600">Password Reset Successful</CardTitle>
                <CardDescription className="text-center">Your password has been successfully reset</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-center mb-6">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>You can now login with new password</AlertDescription>
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
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary p-2">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-xl text-center">Reset Your Password</CardTitle>
              <CardDescription className="text-center">Create a new password for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                    />
                  </div>

                  {showRequirements && Object.values(passwordErrors).some((error) => error) && (
                    <div className="space-y-2">
                      <Label>Password Requirements</Label>
                      <PasswordRequirements 
                        passwordErrors={passwordErrors} 
                        showRequirements={showRequirements} 
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <PasswordInput
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-sm text-green-500 mt-1 flex items-center">
                        <Check className="h-4 w-4 mr-1" /> Passwords match
                      </p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button className="w-full" variant="ghost" asChild>
                <Link to="/login">Back to Login</Link>
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

export default PasswordResetPage;
