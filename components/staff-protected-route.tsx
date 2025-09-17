"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useStaffAuth } from "@/contexts/staff-auth-context"
import { Loader2 } from "lucide-react"

interface StaffProtectedRouteProps {
  children: ReactNode
}

export function StaffProtectedRoute({ children }: StaffProtectedRouteProps) {
  const { user, isLoading } = useStaffAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/staff/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading staff dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
