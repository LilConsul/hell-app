import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot, REGEXP_ONLY_DIGITS } from "@/components/ui/input-otp"
import { Separator } from "@/components/ui/separator"
import { Shield, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useAuth } from "@/contexts/auth-context"
import { PasswordInput } from "@/components/password/password-input"
import HellAppLogo from "../hell-app-logo"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: "Invalid email format." }),
  password: z.string().min(1, { message: "Password is required" }),
})

export function LoginModal({ isOpen, onClose, onRegisterClick, onForgotPasswordClick }) {
  const [serverError, setServerError] = useState(null)
  const [isMFAView, setIsMFAView] = useState(false)
  const [mfaToken, setMfaToken] = useState(null)
  const [mfaCode, setMfaCode] = useState("")
  const [isMfaInputUnlocked, setIsMfaInputUnlocked] = useState(false)
  const [mfaSubmitting, setMfaSubmitting] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoveryError, setRecoveryError] = useState(null)
  const [recoverySuccess, setRecoverySuccess] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const { verifyMFA, refreshUser, requestMFARecovery } = useAuth()
  const navigate = useNavigate()
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

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
      setIsMFAView(false)
      setMfaToken(null)
      setIsMfaInputUnlocked(false)
      setShowRecoveryModal(false)
      setRecoveryError(null)
      setRecoverySuccess(false)
    } else {
      form.reset()
      setMfaCode("")
      setServerError(null)
      setIsMFAView(false)
      setMfaToken(null)
      setIsMfaInputUnlocked(false)
      setShowRecoveryModal(false)
      setRecoveryError(null)
      setRecoverySuccess(false)
      setUserEmail("")
    }
  }, [isOpen, form])

  if (!isOpen) return null

  const onSubmit = async (data) => {
    setServerError(null)
    setUserEmail(data.email)
    
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))
      const resultData = result?.data ?? result

      // Check if MFA is required
      if (resultData?.mfa_required && resultData?.mfa_token) {
        setIsMFAView(true)
        setMfaToken(resultData.mfa_token)
        setMfaCode("")
        setIsMfaInputUnlocked(false)
        return
      }

      // Check for other errors
      if (!response.ok) {
        throw new Error(result?.detail || result?.message || "Login failed. Please try again.")
      }

      // Success - complete login without MFA
      await refreshUser()
      navigate("/dashboard")
      onClose()
    } catch (error) {
      setServerError(error.message || "An unexpected error occurred. Please try again.")
    }
  }

  const onMFASubmit = async () => {
    setServerError(null)

    if (mfaCode.length !== 6) {
      setServerError("Code must be 6 digits")
      return
    }

    setMfaSubmitting(true)

    try {
      await verifyMFA(mfaToken, mfaCode)
      setIsMFAView(false)
      onClose()
    } catch (error) {
      const message = error?.message?.toLowerCase() ?? ""
      if (message.includes("invalid") || message.includes("expired") || message.includes("code")) {
        setServerError("Invalid or expired 2FA code. Please try again.")
      } else {
        setServerError(error.message || "Failed to verify 2FA code. Please try again.")
      }
    } finally {
      setMfaSubmitting(false)
    }
  }

  const handleBackToLogin = () => {
    setIsMFAView(false)
    setMfaToken(null)
    setMfaCode("")
    setIsMfaInputUnlocked(false)
    setServerError(null)
  }

  const handleRecoveryRequest = async () => {
    setRecoveryError(null)
    setRecoverySuccess(false)
    setRecoveryLoading(true)

    try {
      await requestMFARecovery(userEmail)
      setRecoverySuccess(true)
    } catch (error) {
      setRecoveryError(error.message || "Failed to send recovery email. Please try again.")
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleRecoveryModalClose = () => {
    setShowRecoveryModal(false)
    setRecoveryError(null)
    setRecoverySuccess(false)
    if (!recoverySuccess) {
      setMfaCode("")
    }
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    onClose()
    onForgotPasswordClick()
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
          {!isMFAView ? (
            // Login View
            <>
              <div className="space-y-2 text-center">
                <div className="flex justify-center">
                  <HellAppLogo className="h-8 w-8 mb-2" />
                </div>
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Enter your credentials to sign in to your account</p>
              </div>
              
              {serverError && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                  {serverError}
                </div>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-sm" 
                            onClick={handleForgotPassword}
                            type="button"
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <FormControl>
                          <PasswordInput 
                            {...field} 
                            placeholder="Enter your password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="text-center text-sm">
                  Don't have an account?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto" 
                    onClick={onRegisterClick}
                    type="button"
                  >
                    Sign up
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // MFA View
            <>
              <div className="space-y-2 text-center">
                <div className="flex justify-center">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold">Enter 2FA Code</h1>
                <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
              </div>
              
              {serverError && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                  {serverError}
                </div>
              )}
              
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onMFASubmit()
                }}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div className="space-y-2 text-center">
                    <Label htmlFor="mfa-code" className="block w-full text-center">6-Digit Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        id="mfa-code"
                        name="otp"
                        maxLength={6}
                        value={mfaCode}
                        pattern={REGEXP_ONLY_DIGITS}
                        onChange={(value) => setMfaCode(value.replace(/\D/g, "").slice(0, 6))}
                        onComplete={(value) => setMfaCode(value.replace(/\D/g, "").slice(0, 6))}
                        onMouseDown={() => setIsMfaInputUnlocked(true)}
                        onTouchStart={() => setIsMfaInputUnlocked(true)}
                        onFocus={() => setIsMfaInputUnlocked(true)}
                        inputMode="numeric"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        pushPasswordManagerStrategy="none"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        readOnly={!isMfaInputUnlocked}
                        disabled={mfaSubmitting}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={mfaSubmitting || mfaCode.length !== 6}>
                      {mfaSubmitting ? "Verifying..." : "Verify"}
                    </Button>

                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowRecoveryModal(true)}
                      disabled={mfaSubmitting}
                      type="button"
                    >
                      Can't access authenticator?
                    </Button>

                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={handleBackToLogin}
                      disabled={mfaSubmitting}
                      type="button"
                    >
                      Back to Login
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Recovery Modal Overlay */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={handleRecoveryModalClose} aria-hidden="true" />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2" 
              onClick={handleRecoveryModalClose}
              disabled={recoveryLoading}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>

            {!recoverySuccess ? (
              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold">Recover Your Account</h2>
                  <p className="text-sm text-muted-foreground">
                    We'll send a recovery code to your email address to help you regain access.
                  </p>
                </div>

                {recoveryError && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                    {recoveryError}
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Email: <span className="font-mono text-blue-600">{userEmail}</span>
                  </p>
                  
                  <Button 
                    onClick={handleRecoveryRequest}
                    disabled={recoveryLoading}
                    className="w-full"
                  >
                    {recoveryLoading ? "Sending..." : "Send Recovery Email"}
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={handleRecoveryModalClose}
                    disabled={recoveryLoading}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div className="bg-green-100 p-3 rounded-full">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a recovery link to <span className="font-mono text-blue-600">{userEmail}</span>
                  </p>
                </div>

                <div className="space-y-2 bg-muted p-3 rounded text-sm">
                  <p className="font-medium">Next steps:</p>
                  <ol className="text-left space-y-1 text-xs">
                    <li>1. Open the email we sent</li>
                    <li>2. Click the recovery link</li>
                    <li>3. Login again without 2FA</li>
                  </ol>
                </div>

                <Button 
                  onClick={handleRecoveryModalClose}
                  className="w-full"
                >
                  Got it
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

