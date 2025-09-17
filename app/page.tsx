"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Users, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">CivicReport</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700">Welcome, {user.name}</span>
                  <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/login")}>
                    Login
                  </Button>
                  <Button onClick={() => router.push("/register")}>Register</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-6xl">Report Civic Issues</h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Help improve your community by reporting issues like potholes, broken streetlights, graffiti, and more.
            Track progress and see real-time updates on your reports.
          </p>
          <div className="mt-10">
            <Button size="lg" onClick={handleGetStarted} className="px-8 py-3 text-lg">
              Get Started
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Location-Based Reporting</CardTitle>
              <CardDescription>
                Automatically capture your location when reporting issues for accurate tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Community Engagement</CardTitle>
              <CardDescription>See what issues others in your community are reporting and their status</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Real-Time Updates</CardTitle>
              <CardDescription>Get instant notifications when your reported issues are being addressed</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">1,234</div>
              <div className="text-gray-600">Issues Reported</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">892</div>
              <div className="text-gray-600">Issues Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">567</div>
              <div className="text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2024 CivicReport. Making communities better, one report at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
