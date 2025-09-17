"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, Plus, FileText, Users, CheckCircle, Settings, Menu, X, Crown, Briefcase, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ConnectionStatus } from "@/components/connection-status"
import { NotificationBell } from "@/components/notification-bell"

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Role-aware navigation (no mutation)
  const navItems = user?.role === "admin"
    ? [
        { name: "User Dashboard", href: "/dashboard", icon: Home },
        { name: "Admin Dashboard", href: "/admin", icon: Crown },
        { name: "All Dashboards", href: "/dashboards", icon: LayoutDashboard },
        { name: "General Issues", href: "/issues", icon: Users },
        { name: "Solved Issues", href: "/solved", icon: CheckCircle },
      ]
    : user?.role === "staff"
    ? [
        { name: "Staff Dashboard", href: "/staff", icon: Briefcase },
        { name: "User Dashboard", href: "/dashboard", icon: Home },
        { name: "All Dashboards", href: "/dashboards", icon: LayoutDashboard },
        { name: "General Issues", href: "/issues", icon: Users },
        { name: "Solved Issues", href: "/solved", icon: CheckCircle },
      ]
    : [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "Report Issue", href: "/report", icon: Plus },
        { name: "My Reports", href: "/my-reports", icon: FileText },
        { name: "All Dashboards", href: "/dashboards", icon: LayoutDashboard },
        { name: "General Issues", href: "/issues", icon: Users },
        { name: "Solved Issues", href: "/solved", icon: CheckCircle },
      ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">CivicReport</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <ConnectionStatus />
            <NotificationBell />
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}

              {/* Mobile User Section */}
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="px-3 py-2">
                  <ConnectionStatus />
                </div>
                <div className="px-3 py-2">
                  <NotificationBell />
                </div>
                <div className="px-3 py-2 text-sm text-gray-600">Welcome, {user?.name}</div>
                <Button variant="outline" size="sm" className="mx-3 w-full" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
