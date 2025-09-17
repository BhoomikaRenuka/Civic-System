"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface StaffUser {
  id: string
  email: string
  name: string
  role: string
  category: string
}

interface StaffAuthContextType {
  user: StaffUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined)

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing staff token on mount
    const token = localStorage.getItem("token_staff")
    const userData = localStorage.getItem("user_staff")
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error("Error parsing staff user data:", error)
        localStorage.removeItem("token_staff")
        localStorage.removeItem("user_staff")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:5000/staff/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Login failed")
      }

      const data = await response.json()
      
      // Store staff token and user data
      localStorage.setItem("token_staff", data.access_token)
      localStorage.setItem("user_staff", JSON.stringify(data.user))
      
      setUser(data.user)
    } catch (error) {
      console.error("Staff login error:", error)
      throw error
    }
  }

  const logout = () => {
  localStorage.removeItem("token_staff")
  localStorage.removeItem("user_staff")
  setUser(null)
  // Redirect to the homepage using window.location.href for full redirect
  window.location.href = "http://localhost:3000"
}


  return (
    <StaffAuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext)
  if (context === undefined) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider")
  }
  return context
}
