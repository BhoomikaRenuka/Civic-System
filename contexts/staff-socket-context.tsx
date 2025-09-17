"use client"

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { useStaffAuth } from "./staff-auth-context"

interface StaffSocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const StaffSocketContext = createContext<StaffSocketContextType | undefined>(undefined)

export function StaffSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useStaffAuth()

  useEffect(() => {
    if (user) {
      // Initialize socket connection for staff
      const newSocket = io("http://localhost:5000", {
        auth: {
          token: localStorage.getItem("token_staff"),
          userType: "staff",
          category: user.category,
        },
      })

      newSocket.on("connect", () => {
        console.log("Staff socket connected")
        setIsConnected(true)
      })

      newSocket.on("disconnect", () => {
        console.log("Staff socket disconnected")
        setIsConnected(false)
      })

      newSocket.on("issue_updated", (data) => {
        console.log("Issue updated:", data)
        // Handle real-time issue updates
      })

      newSocket.on("new_issue", (data) => {
        console.log("New issue in category:", data)
        // Handle new issues in staff category
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user])

  return (
    <StaffSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </StaffSocketContext.Provider>
  )
}

export function useStaffSocket() {
  const context = useContext(StaffSocketContext)
  if (context === undefined) {
    throw new Error("useStaffSocket must be used within a StaffSocketProvider")
  }
  return context
}
