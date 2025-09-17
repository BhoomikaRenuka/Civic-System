"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserCheck, Shield } from "lucide-react"
import { useStaffAuth } from "@/contexts/staff-auth-context"

export default function StaffLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useStaffAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
      router.push("/staff")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const staffAccounts = [
    { email: "road.staff@civicreport.com", password: "road123", department: "Road Maintenance", category: "Road" },
    { email: "lighting.staff@civicreport.com", password: "lighting123", department: "Street Lighting", category: "Electricity" },
    { email: "waste.staff@civicreport.com", password: "waste123", department: "Waste Management", category: "Waste" },
    { email: "water.staff@civicreport.com", password: "water123", department: "Water Department", category: "Water" },
    { email: "general.staff@civicreport.com", password: "general123", department: "General Services", category: "Other" },
  ]

  const quickLogin = (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Staff Portal</h1>
          </div>
          <p className="text-xl text-gray-600">Civic Issue Reporting System - Staff Management</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Form */}
          <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Staff Login</CardTitle>
              <CardDescription className="text-center">
                Enter your staff credentials to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@civicreport.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Login Options */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Login - Staff Departments</CardTitle>
              <CardDescription>
                Click on your department to auto-fill login credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffAccounts.map((account, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => quickLogin(account.email, account.password)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{account.department}</h3>
                        <p className="text-sm text-gray-600">Category: {account.category}</p>
                        <p className="text-xs text-gray-500">{account.email}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Each staff member can only view and manage issues from their assigned department category.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
