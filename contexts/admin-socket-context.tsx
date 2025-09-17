"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { useAdminAuth } from "./admin-auth-context"

interface AdminSocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const AdminSocketContext = createContext<AdminSocketContextType | undefined>(undefined)

export function AdminSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAdminAuth()

  useEffect(() => {
    if (user) {
      const s = io("http://localhost:5000", { transports: ["websocket"], autoConnect: true })
      s.on("connect", () => {
        setIsConnected(true)
        s.emit("join_room", { room: "admins" })
      })
      s.on("disconnect", () => setIsConnected(false))
      setSocket(s)
      return () => {
        s.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    } else if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [user])

  return <AdminSocketContext.Provider value={{ socket, isConnected }}>{children}</AdminSocketContext.Provider>
}

export function useAdminSocket() {
  const ctx = useContext(AdminSocketContext)
  if (!ctx) throw new Error("useAdminSocket must be used within an AdminSocketProvider")
  return ctx
}


