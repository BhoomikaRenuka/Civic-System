"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { authApi, staffApi, adminApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Try different login endpoints based on email pattern and credentials
      let response = null
      let userType = null

      // First, try to determine user type based on email pattern
      if (email.includes('.staff@') || email.includes('staff@')) {
        // Try staff login first
        try {
          response = await staffApi.login(email, password)
          userType = 'staff'
        } catch (staffError) {
          // If staff login fails, try regular user login
          try {
            response = await authApi.login({ email, password })
            userType = 'user'
          } catch (userError) {
            // If both fail, try admin login
            response = await adminApi.login(email, password)
            userType = 'admin'
          }
        }
      } else if (email.includes('admin@') || email === 'admin@civicreport.com') {
        // Try admin login first
        try {
          response = await adminApi.login(email, password)
          userType = 'admin'
        } catch (adminError) {
          // If admin login fails, try regular user login
          try {
            response = await authApi.login({ email, password })
            userType = 'user'
          } catch (userError) {
            // If both fail, try staff login
            response = await staffApi.login(email, password)
            userType = 'staff'
          }
        }
      } else {
        // Try regular user login first
        try {
          response = await authApi.login({ email, password })
          userType = 'user'
        } catch (userError) {
          // If user login fails, try staff login
          try {
            response = await staffApi.login(email, password)
            userType = 'staff'
          } catch (staffError) {
            // If both fail, try admin login
            response = await adminApi.login(email, password)
            userType = 'admin'
          }
        }
      }

      // Store credentials and redirect based on user type
      if (response && userType) {
        if (userType === 'staff') {
          // Store staff credentials
          localStorage.setItem("token_staff", response.access_token)
          localStorage.setItem("user_staff", JSON.stringify(response.user))
          router.push("/staff")
        } else if (userType === 'admin') {
          // Store admin credentials
          localStorage.setItem("token_admin", response.access_token)
          localStorage.setItem("user_admin", JSON.stringify(response.user))
          router.push("/admin")
        } else {
          // Store regular user credentials
          login(response.user, response.access_token)
          router.push("/dashboard")
        }
      } else {
        setError("Invalid credentials. Please check your email and password.")
      }
    } catch (err) {
      setError("Invalid credentials. Please check your email and password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">CivicReport</h1>
          </div>
          <p className="text-gray-600">Sign in with your credentials - User, Staff, or Admin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials - system will automatically route you to the correct dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
