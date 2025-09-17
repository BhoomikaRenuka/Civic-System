"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  LogOut,
  Shield,
  TrendingUp,
  BarChart3,
  Users,
  FileText,
  Home,
} from "lucide-react"
import { StaffProtectedRoute } from "@/components/staff-protected-route"
import { useStaffAuth } from "@/contexts/staff-auth-context"
import { useStaffSocket } from "@/contexts/staff-socket-context"
import Link from "next/link"

const statusColors = {
  Pending: "#f59e0b",
  "In Progress": "#3b82f6", 
  Resolved: "#10b981",
}

const statusIcons = {
  Pending: Clock,
  "In Progress": Settings,
  Resolved: CheckCircle,
}

export default function StaffDashboardPage() {
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const { user, logout } = useStaffAuth()
  const { socket, isConnected } = useStaffSocket()

  // Load staff reports (filtered by category)
  const loadReports = async () => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token_staff")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch("http://localhost:5000/staff/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }

      const data = await response.json()
      setReports(data.issues || [])
    } catch (err: any) {
      setError(err.message || "Failed to load reports")
    } finally {
      setIsLoading(false)
    }
  }

  // Update issue status
  const updateStatus = async (issueId: string, newStatus: string) => {
    try {
      setUpdatingStatus(issueId)
      setError("")

      const token = localStorage.getItem("token_staff")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`http://localhost:5000/staff/reports/${issueId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const data = await response.json()
      setSuccess(`Status updated to ${newStatus}. Email notification sent to user.`)
      
      // Update local state
      setReports(prev => 
        prev.map(report => 
          report._id === issueId 
            ? { ...report, status: newStatus }
            : report
        )
      )

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    } finally {
      setUpdatingStatus(null)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on("issue_updated", (data) => {
        if (data.category === user?.category) {
          loadReports() // Refresh reports when issues in this category are updated
        }
      })

      socket.on("new_issue", (data) => {
        if (data.category === user?.category) {
          loadReports() // Refresh reports when new issues are added to this category
        }
      })

      return () => {
        socket.off("issue_updated")
        socket.off("new_issue")
      }
    }
  }, [socket, user?.category])

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || AlertTriangle
    return <Icon className="h-4 w-4" />
  }

  const getStatusBadge = (status: string) => {
    const color = statusColors[status as keyof typeof statusColors] || "#6b7280"
    return (
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1"
        style={{ backgroundColor: `${color}20`, color: color, borderColor: color }}
      >
        {getStatusIcon(status)}
        {status}
      </Badge>
    )
  }

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "Pending").length,
    inProgress: reports.filter(r => r.status === "In Progress").length,
    resolved: reports.filter(r => r.status === "Resolved").length,
  }

  return (
    <StaffProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
                  <p className="text-sm text-gray-600">
                    {user?.name} - {user?.category} Department
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Button variant="outline" onClick={loadReports} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="issues" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manage Issues
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      In {user?.category} category
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting action
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Settings className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                    <p className="text-xs text-muted-foreground">
                      Being worked on
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    <p className="text-xs text-muted-foreground">
                      Completed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Recent Issues
                    </CardTitle>
                    <CardDescription>
                      Latest issues in your department
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reports.slice(0, 3).length}</div>
                    <p className="text-sm text-gray-600">New this week</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Citizens Helped
                    </CardTitle>
                    <CardDescription>
                      Issues resolved this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.resolved}</div>
                    <p className="text-sm text-gray-600">Happy citizens</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Performance
                    </CardTitle>
                    <CardDescription>
                      Department efficiency
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                    </div>
                    <p className="text-sm text-gray-600">Resolution rate</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Issues Management Tab */}
            <TabsContent value="issues" className="space-y-6">

              {/* Alerts */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Issues Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Issues in {user?.category} Department</CardTitle>
                  <CardDescription>
                    Review and update the status of issues assigned to your department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Loading issues...</p>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No issues found in {user?.category} category</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Reported By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report._id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{report.title}</div>
                                <div className="text-sm text-gray-600 truncate max-w-xs">
                                  {report.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="text-sm">
                                  {report.location?.address || "Not specified"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{report.user_name}</div>
                                <div className="text-sm text-gray-600">{report.user_email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(report.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(report.status)}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={report.status}
                                onValueChange={(value) => updateStatus(report._id, value)}
                                disabled={updatingStatus === report._id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Department Performance</CardTitle>
                    <CardDescription>
                      Your department's issue resolution statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Resolution Rate</span>
                        <span className="text-sm text-gray-600">
                          {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">In Progress Rate</span>
                        <span className="text-sm text-gray-600">
                          {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest updates in your department
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reports.slice(0, 5).map((report) => (
                        <div key={report._id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                          <div className={`w-2 h-2 rounded-full ${
                            report.status === 'Resolved' ? 'bg-green-500' :
                            report.status === 'In Progress' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{report.title}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {report.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </StaffProtectedRoute>
  )
}
