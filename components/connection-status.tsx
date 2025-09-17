"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Users } from "lucide-react"
import { useSocket } from "@/contexts/socket-context"

export function ConnectionStatus() {
  const { isConnected, onlineUsers } = useSocket()

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-1">
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span>{isConnected ? "Connected" : "Disconnected"}</span>
      </Badge>

      {isConnected && onlineUsers > 0 && (
        <Badge variant="outline" className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>{onlineUsers} online</span>
        </Badge>
      )}
    </div>
  )
}
