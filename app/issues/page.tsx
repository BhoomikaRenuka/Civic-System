"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Filter, AlertTriangle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { ReportCard } from "@/components/report-card"
import { issuesApi } from "@/lib/api"

export default function IssuesPage() {
  const [issues, setIssues] = useState<any[]>([])
  const [filteredIssues, setFilteredIssues] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await issuesApi.getAllIssues()
        setIssues(response.issues)
        setFilteredIssues(response.issues)
      } catch (error) {
        console.error("Failed to fetch issues:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchIssues()
  }, [])

  useEffect(() => {
    let filtered = issues

    if (statusFilter !== "all") {
      filtered = filtered.filter((issue: any) => issue.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((issue: any) => issue.category === categoryFilter)
    }

    setFilteredIssues(filtered)
  }, [issues, statusFilter, categoryFilter])

  // Group issues by category
  const groupedIssues = filteredIssues.reduce((acc: any, issue: any) => {
    if (!acc[issue.category]) {
      acc[issue.category] = []
    }
    acc[issue.category].push(issue)
    return acc
  }, {})

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Community Issues</h1>
            <p className="text-gray-600 mt-2">See what issues are being reported in your community</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
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
                </div>
                <div className="flex-1">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues by Category */}
          {Object.keys(groupedIssues).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedIssues).map(([category, categoryIssues]: [string, any]) => (
                <div key={category}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-gray-600" />
                    {category} ({categoryIssues.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryIssues.map((issue: any) => (
                      <ReportCard key={issue._id} report={issue} showUserName={true} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {issues.length === 0 ? "No issues reported yet" : "No issues match your filters"}
                </h3>
                <p className="text-gray-600">
                  {issues.length === 0
                    ? "Be the first to report an issue in your community."
                    : "Try adjusting your filters to see more issues."}
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
