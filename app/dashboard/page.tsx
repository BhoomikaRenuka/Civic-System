"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Users, CheckCircle, AlertTriangle, Clock, Settings } from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { issuesApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    myReports: 0,
    totalIssues: 0,
    resolvedIssues: 0,
    pendingIssues: 0,
  })
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const allIssuesRes = await issuesApi.getAllIssues()
      const allIssues = allIssuesRes.issues

      if (user?.role === "admin") {
        // Admin sees all system stats
        setStats({
          myReports: 0, // Not applicable for admin
          totalIssues: allIssues.length,
          resolvedIssues: allIssues.filter((issue) => issue.status === "Resolved").length,
          pendingIssues: allIssues.filter((issue) => issue.status === "Pending").length,
        })
        setRecentReports([]) // No recent reports for admin
      } else if (user?.role === "staff") {
        // Staff sees category-specific stats - NO My Reports or Recent Reports
        const categoryIssues = allIssues.filter((issue) => issue.category === user.category)
        setStats({
          myReports: 0, // Not applicable for staff
          totalIssues: categoryIssues.length,
          resolvedIssues: categoryIssues.filter((issue) => issue.status === "Resolved").length,
          pendingIssues: categoryIssues.filter((issue) => issue.status === "Pending").length,
        })
        setRecentReports([]) // No recent reports for staff
      } else {
        // Regular users see their own stats
        const myReportsRes = await issuesApi.getMyReports()
        const myReports = myReportsRes.issues

        setStats({
          myReports: myReports.length,
          totalIssues: allIssues.length,
          resolvedIssues: allIssues.filter((issue) => issue.status === "Resolved").length,
          pendingIssues: allIssues.filter((issue) => issue.status === "Pending").length,
        })
        setRecentReports(myReports.slice(0, 5))
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    const handleNewIssue = () => {
      console.log("[v0] Dashboard refreshing due to new issue")
      fetchDashboardData()
    }

    const handleStatusUpdate = () => {
      console.log("[v0] Dashboard refreshing due to status update")
      fetchDashboardData()
    }

    window.addEventListener("newIssueReported", handleNewIssue)
    window.addEventListener("issueStatusUpdated", handleStatusUpdate)

    return () => {
      window.removeEventListener("newIssueReported", handleNewIssue)
      window.removeEventListener("issueStatusUpdated", handleStatusUpdate)
    }
  }, [])

  // Role-based quick actions
  const quickActions = user?.role === "admin"
    ? [
        {
          title: "Community Issues",
          description: "Browse all community issues",
          icon: Users,
          href: "/issues",
          color: "bg-purple-500 hover:bg-purple-600",
        },
        {
          title: "Solved Issues",
          description: "View resolved issues",
          icon: CheckCircle,
          href: "/solved",
          color: "bg-orange-500 hover:bg-orange-600",
        },
        {
          title: "Admin Panel",
          description: "Access administrative functions",
          icon: Plus,
          href: "/admin",
          color: "bg-red-500 hover:bg-red-600",
        },
      ]
    : user?.role === "staff"
    ? [
        {
          title: "Category Issues",
          description: `View ${user.category || 'assigned'} category issues`,
          icon: Users,
          href: "/issues",
          color: "bg-blue-500 hover:bg-blue-600",
        },
        {
          title: "Resolved Issues",
          description: "View resolved issues in your category",
          icon: CheckCircle,
          href: "/solved",
          color: "bg-green-500 hover:bg-green-600",
        },
        {
          title: "Staff Tools",
          description: "Access staff management dashboard",
          icon: Settings,
          href: "#",
          color: "bg-orange-500 hover:bg-orange-600",
          onClick: () => window.open('/staff_dashboard.html', '_blank'),
        },
      ]
    : [
        {
          title: "Report New Issue",
          description: "Submit a new civic issue report",
          icon: Plus,
          href: "/report",
          color: "bg-blue-500 hover:bg-blue-600",
        },
        {
          title: "My Reports",
          description: "View your submitted reports",
          icon: FileText,
          href: "/my-reports",
          color: "bg-green-500 hover:bg-green-600",
        },
        {
          title: "Community Issues",
          description: "Browse all community issues",
          icon: Users,
          href: "/issues",
          color: "bg-purple-500 hover:bg-purple-600",
        },
        {
          title: "Solved Issues",
          description: "View resolved issues",
          icon: CheckCircle,
          href: "/solved",
          color: "bg-orange-500 hover:bg-orange-600",
        },
      ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "text-yellow-600 bg-yellow-100"
      case "In Progress":
        return "text-blue-600 bg-blue-100"
      case "Resolved":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
            <p className="text-gray-600 mt-2">Here's what's happening in your community today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* My Reports card - only for regular users */}
            {user?.role === "user" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Reports</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.myReports}</div>
                  <p className="text-xs text-muted-foreground">Issues you've reported</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalIssues}</div>
                <p className="text-xs text-muted-foreground">Community-wide issues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.resolvedIssues}</div>
                <p className="text-xs text-muted-foreground">Issues completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingIssues}</div>
                <p className="text-xs text-muted-foreground">Awaiting action</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks you can perform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quickActions.map((action) => {
                      const Icon = action.icon

                      // Handle special onClick actions (like staff tools)
                      if (action.onClick) {
                        return (
                          <div key={action.title} className="group cursor-pointer" onClick={action.onClick}>
                            <div className="flex items-center p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                              <div className={`p-3 rounded-lg ${action.color} text-white mr-4`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                  {action.title}
                                </h3>
                                <p className="text-sm text-gray-600">{action.description}</p>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // Regular link actions
                      return (
                        <Link key={action.title} href={action.href}>
                          <div className="group cursor-pointer">
                            <div className="flex items-center p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                              <div className={`p-3 rounded-lg ${action.color} text-white mr-4`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                  {action.title}
                                </h3>
                                <p className="text-sm text-gray-600">{action.description}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports - Only for regular users, NOT for staff or admin */}
            {user?.role === "user" && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Your latest submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentReports.length > 0 ? (
                      <div className="space-y-4">
                        {recentReports.map((report: any) => (
                          <div key={report._id} className="border-b pb-3 last:border-b-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">{report.title}</h4>
                            <div className="flex items-center justify-between mt-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                              >
                                {report.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(report.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        <Link href="/my-reports">
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            View All Reports
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No reports yet</p>
                        <Link href="/report">
                          <Button size="sm" className="mt-2">
                            Report Your First Issue
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
