"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: number
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      // Initialize socket connection when user is authenticated
      const newSocket = io("http://localhost:5000", {
        transports: ["websocket"],
        autoConnect: true,
      })

      // Connection event handlers
      newSocket.on("connect", () => {
        console.log("[v0] Socket connected:", newSocket.id)
        setIsConnected(true)

        // Join user-specific room for personalized notifications
        const room = `user_${user.id}`
        console.log("[v0] Joining room:", room)
        newSocket.emit("join_room", { room })

        // If admin, also join the admins room
        if (user.role === "admin") {
          newSocket.emit("join_room", { room: "admins" })
          console.log("[v0] Joining room: admins")
        }
      })

      newSocket.on("disconnect", () => {
        console.log("[v0] Socket disconnected")
        setIsConnected(false)
      })

      newSocket.on("connected", (data) => {
        console.log("[v0] Server connection confirmed:", data.message)
      })

      newSocket.on("joined_room", (data) => {
        console.log("[v0] Joined room confirmation:", data)
      })

      // Real-time event handlers
      newSocket.on("new_issue", (data) => {
        console.log("[v0] New issue received:", data)
        toast({
          title: "New Issue Reported",
          description: `${data.user_name} reported: ${data.title}`,
          duration: 5000,
        })

        // Trigger custom event for components to refresh data
        window.dispatchEvent(new CustomEvent("newIssueReported", { detail: data }))
      })

      newSocket.on("status_update", (data) => {
        console.log("[v0] Status update received:", data)
        toast({
          title: "Issue Status Updated",
          description: `${data.title} is now ${data.status}`,
          duration: 5000,
        })

        // Trigger custom event for components to refresh data
        window.dispatchEvent(new CustomEvent("issueStatusUpdated", { detail: data }))
      })

      newSocket.on("user_count", (count) => {
        setOnlineUsers(count)
      })

      // Error handling
      newSocket.on("connect_error", (error) => {
        console.error("[v0] Socket connection error:", error)
        toast({
          title: "Connection Error",
          description: "Unable to connect to real-time updates",
          variant: "destructive",
          duration: 3000,
        })
      })

      setSocket(newSocket)

      // Cleanup on unmount or user change
      return () => {
        console.log("[v0] Cleaning up socket connection")
        newSocket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    } else {
      // Disconnect socket when user logs out
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user, toast])

  return <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
