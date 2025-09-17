"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Eye,
} from "lucide-react"
import { AdminProtectedRoute } from "@/components/admin-protected-route"
import { Navbar } from "@/components/navbar"
import { issuesApi } from "@/lib/api"

const categories = [
  "Road Issues",
  "Street Lighting",
  "Waste Management",
  "Water & Drainage",
  "Public Safety",
  "Parks & Recreation",
  "Traffic Signals",
  "Graffiti",
  "Other",
]

const statusColors = {
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  Resolved: "#10b981",
}

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<any[]>([])
  const [filteredReports, setFilteredReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [reports, statusFilter, categoryFilter, locationFilter, searchQuery])

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      const response = await issuesApi.getAdminReports()
      setReports(response.issues)
    } catch (err) {
      setError("Failed to fetch reports")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = reports

    if (statusFilter !== "all") {
      filtered = filtered.filter((report: any) => report.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((report: any) => report.category === categoryFilter)
    }

    if (locationFilter) {
      filtered = filtered.filter((report: any) =>
        report.location?.address?.toLowerCase().includes(locationFilter.toLowerCase()),
      )
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (report: any) =>
          report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.user_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredReports(filtered)
  }

  const updateIssueStatus = async (issueId: string, newStatus: string) => {
    try {
      setUpdatingStatus(issueId)
      await issuesApi.updateIssueStatus({ issue_id: issueId, status: newStatus })

      // Update local state
      setReports((prev) =>
        prev.map((report: any) =>
          report._id === issueId ? { ...report, status: newStatus, updated_at: new Date().toISOString() } : report,
        ),
      )

      setSuccess(`Issue status updated to ${newStatus}`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to update issue status")
      setTimeout(() => setError(""), 3000)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStats = () => {
    const total = reports.length
    const pending = reports.filter((r: any) => r.status === "Pending").length
    const inProgress = reports.filter((r: any) => r.status === "In Progress").length
    const resolved = reports.filter((r: any) => r.status === "Resolved").length

    return { total, pending, inProgress, resolved }
  }

  const getCategoryStats = () => {
    const categoryCount = categories
      .map((category) => ({
        name: category,
        count: reports.filter((r: any) => r.category === category).length,
      }))
      .filter((item) => item.count > 0)

    return categoryCount
  }

  const getStatusStats = () =>
    [
      {
        name: "Pending",
        value: reports.filter((r: any) => r.status === "Pending").length,
        color: statusColors.Pending,
      },
      {
        name: "In Progress",
        value: reports.filter((r: any) => r.status === "In Progress").length,
        color: statusColors["In Progress"],
      },
      {
        name: "Resolved",
        value: reports.filter((r: any) => r.status === "Resolved").length,
        color: statusColors.Resolved,
      },
    ].filter((item) => item.value > 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const renderPieLabel = (props: any): ReactNode => {
    const { name, percent } = props || {}
    return `${name} ${((percent || 0) * 100).toFixed(0)}%`
  }

  const stats = getStats()
  const categoryStats = getCategoryStats()
  const statusStats = getStatusStats()

  if (isLoading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage and monitor all civic issue reports</p>
          </div>

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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All time reports</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting action</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Being addressed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList>
              <TabsTrigger value="reports">Reports Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />

                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter("all")
                        setCategoryFilter("all")
                        setLocationFilter("")
                        setSearchQuery("")
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Reports ({filteredReports.length})</CardTitle>
                  <CardDescription>Manage and update issue statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Issue</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report: any) => (
                          <TableRow key={report._id}>
                            <TableCell>
                              <div className="max-w-xs">
                                <div className="font-medium truncate">{report.title}</div>
                                <div className="text-sm text-gray-500 truncate">{report.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {report.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{report.user_name}</div>
                                <div className="text-gray-500">{report.user_email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-xs">{report.location?.address || "No location"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(report.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={report.status}
                                  onValueChange={(value) => updateIssueStatus(report._id, value)}
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

                                {report.image && (
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {filteredReports.length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                      <p className="text-gray-600">
                        {reports.length === 0
                          ? "No reports have been submitted yet."
                          : "Try adjusting your filters to see more reports."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Reports by Category</CardTitle>
                    <CardDescription>Distribution of issues across different categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status Distribution</CardTitle>
                    <CardDescription>Current status of all reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderPieLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="map" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Map View
                  </CardTitle>
                  <CardDescription>Geographic distribution of reported issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Map View Placeholder</h3>
                      <p className="text-gray-600 max-w-md">
                        Interactive map showing the geographic distribution of reported issues would be displayed here.
                        Integration with Leaflet or Google Maps can be added for production use.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AdminProtectedRoute>
  )
}
