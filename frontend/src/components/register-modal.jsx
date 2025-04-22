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

// Password must include at least one uppercase, one lowercase, one digit, and one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=]).{8,}$/

const registerSchema = z.object({
  first_name: z.string().min(2, { message: "First name is required" }),
  last_name: z.string().min(2, { message: "Last name is required" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: "Invalid email format." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(passwordRegex, { message: "Password must meet security requirements." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export function RegisterModal({ isOpen, onClose, onLoginClick }) {
  const [serverError, setServerError] = useState(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
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
      setRegistrationSuccess(false)
    } else {
      form.reset()
      setServerError(null)
      setRegistrationSuccess(false)
    }
  }, [isOpen, form])

  if (!isOpen) return null

  const onSubmit = async (data) => {
    setServerError(null)
    
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: data.password
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        if (result.detail && result.detail.includes("already exists")) {
          form.setError("email", { 
            type: "manual",
            message: "Email already in use."
          })
        } else {
          setServerError(result.detail || "An error occurred during registration")
        }
        return
      }
      
      setRegistrationSuccess(true)

      // After successful registration, redirect or show verification message
      setTimeout(() => {
        onClose()
        // redirect to login
        onLoginClick()
      }, 3000)
    } catch (error) {
      console.error("Registration failed:", error)
      setServerError("An unexpected error occurred. Please try again.")
    }
  }

  if (registrationSuccess) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
        <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6 text-center">
          <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>

          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Registration Successful!</h2>
            <p className="text-muted-foreground">
              Please check your email to verify your account. You will be redirected to login shortly.
            </p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )
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
            <h1 className="text-2xl font-bold">Create an account</h1>
            <p className="text-sm text-muted-foreground">Enter your information to create an account</p>
          </div>
          
          {serverError && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
              {serverError}
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>
          
          <Separator />
          
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Implement Google login

              }}
            >
              Continue with Google
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={onLoginClick}
                type="button"
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
