"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Shield, 
  Settings, 
  Home, 
  ArrowRight,
  UserCheck,
  Crown,
  Briefcase
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export function DashboardNavigation() {
  const { user: regularUser } = useAuth()
  const router = useRouter()

  // For this navigation component, we'll primarily use the regular auth
  // Staff users can access this page but we'll get their info from localStorage if needed
  const [staffUser, setStaffUser] = useState<any>(null)

  useEffect(() => {
    // Check if there's a staff user in localStorage
    const staffUserData = localStorage.getItem("user_staff")
    if (staffUserData) {
      try {
        setStaffUser(JSON.parse(staffUserData))
      } catch (error) {
        console.error("Error parsing staff user data:", error)
      }
    }
  }, [])

  const currentUser = regularUser || staffUser

  const dashboards = [
    {
      id: "user",
      title: "User Dashboard",
      description: "Report issues and track your submissions",
      icon: Users,
      href: "/dashboard",
      color: "bg-blue-500",
      available: true,
      features: ["Report Issues", "Track Status", "View History"]
    },
    {
      id: "staff", 
      title: "Staff Dashboard",
      description: "Manage department-specific issues",
      icon: Briefcase,
      href: "/staff",
      color: "bg-green-500",
      available: currentUser?.role === "staff",
      features: ["Review Issues", "Update Status", "Department Analytics"]
    },
    {
      id: "admin",
      title: "Admin Dashboard", 
      description: "Full system administration and oversight",
      icon: Crown,
      href: "/admin",
      color: "bg-purple-500",
      available: currentUser?.role === "admin",
      features: ["System Overview", "User Management", "All Categories"]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Civic Issue Reporting System
          </h1>
          <p className="text-lg text-gray-600">
            Choose your dashboard based on your role
          </p>
          {currentUser && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Logged in as: {currentUser.name}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Role: {currentUser.role}
              </Badge>
              {currentUser.category && (
                <Badge variant="outline" className="text-sm">
                  Department: {currentUser.category}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon
            const isAvailable = dashboard.available
            
            return (
              <Card 
                key={dashboard.id} 
                className={`relative transition-all duration-200 ${
                  isAvailable 
                    ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${dashboard.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {isAvailable && (
                      <Badge variant="secondary" className="text-xs">
                        Available
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{dashboard.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {dashboard.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">Features:</h4>
                      <ul className="space-y-1">
                        {dashboard.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {isAvailable ? (
                      <Link href={dashboard.href}>
                        <Button className="w-full mt-4" size="sm">
                          Access Dashboard
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled className="w-full mt-4" size="sm">
                        Access Restricted
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Access Section */}
        {currentUser && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Quick Access
                </CardTitle>
                <CardDescription>
                  Jump directly to your most relevant dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {currentUser.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        <Crown className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  
                  {currentUser.role === "staff" && (
                    <Link href="/staff">
                      <Button variant="outline" size="sm">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Staff Dashboard
                      </Button>
                    </Link>
                  )}
                  
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      User Dashboard
                    </Button>
                  </Link>
                  
                  <Link href="/report">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Login Prompt for Non-authenticated Users */}
        {!currentUser && (
          <div className="mt-12 text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Not Logged In</CardTitle>
                <CardDescription>
                  Please log in to access the appropriate dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      User Login
                    </Button>
                  </Link>
                  <Link href="/staff/login">
                    <Button variant="outline" className="w-full">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Staff Login
                    </Button>
                  </Link>
                  <Link href="/admin/login">
                    <Button variant="outline" className="w-full">
                      <Crown className="h-4 w-4 mr-2" />
                      Admin Login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
