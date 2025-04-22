import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Shield, X } from "lucide-react"
import { createPortal } from "react-dom"
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
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting

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
    } else {
      form.reset()
      setServerError(null)
    }
  }, [isOpen, form])

  if (!isOpen) return null

  const onSubmit = async (data) => {
    setServerError(null)
    
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        }),
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setServerError(result.detail || "An error occurred during login");
        return
      }
      
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Login failed:", error)
      setServerError("An unexpected error occurred. Please try again.")
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
          <div className="space-y-2 text-center">
            <div className="flex justify-center">
              <Shield className="h-8 w-8" />
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
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
          
          <Separator />
          
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                // TODO // 
              }}
            >
              Continue with Google
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
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
        </div>
      </div>
    </div>,
    document.body,
  )
}
