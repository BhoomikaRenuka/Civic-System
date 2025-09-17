"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { ReportCard } from "@/components/report-card"
import { issuesApi } from "@/lib/api"

export default function SolvedIssuesPage() {
  const [solvedIssues, setSolvedIssues] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSolvedIssues = async () => {
      try {
        const response = await issuesApi.getAllIssues({ status: "Resolved" })
        setSolvedIssues(response.issues)
      } catch (error) {
        console.error("Failed to fetch solved issues:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSolvedIssues()
  }, [])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              Solved Issues
            </h1>
            <p className="text-gray-600 mt-2">Issues that have been successfully resolved by the authorities</p>
          </div>

          {solvedIssues.length > 0 ? (
            <>
              <div className="mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{solvedIssues.length}</div>
                      <div className="text-gray-600">Issues Successfully Resolved</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {solvedIssues.map((issue: any) => (
                  <ReportCard key={issue._id} report={issue} showUserName={true} />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No solved issues yet</h3>
                <p className="text-gray-600">
                  Resolved issues will appear here once authorities address reported problems.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
