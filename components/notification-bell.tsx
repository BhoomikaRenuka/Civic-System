"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notificationsApi, type NotificationItem } from "@/lib/api"
import { useSocket } from "@/contexts/socket-context"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { socket } = useSocket()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const { notifications, unread_count } = await notificationsApi.getNotifications({ limit: "20" })
      setNotifications(notifications)
      setUnreadCount(unread_count)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id)
      if (!unreadIds.length) return
      await notificationsApi.markRead(unreadIds)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.read) {
      notificationsApi.markRead([n._id])
      setNotifications(prev => prev.map(notif => notif._id === n._id ? { ...notif, read: true } : notif))
      setUnreadCount(c => Math.max(0, c - 1))
    }
    if (n.issue_id) router.push(`/issues/${n.issue_id}`)
    setOpen(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (data: any) => {
      const newItem: NotificationItem = {
        _id: Math.random().toString(36).slice(2),
        user_id: "",
        type: data.type || "info",
        title: data.title || "Notification",
        message: data.message || "",
        issue_id: data.issue_id,
        status: data.status,
        read: false,
        created_at: data.created_at || new Date().toISOString(),
      }
      setNotifications(prev => [newItem, ...prev].slice(0, 20))
      setUnreadCount(c => c + 1)
    }
    socket.on("notification", handler)
    return () => { socket.off("notification", handler) }
  }, [socket])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(prev => !prev)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1 min-w-[18px] text-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed top-16 right-4 w-80 bg-white shadow-lg rounded-lg border z-50">
          <div className="px-3 py-2 flex items-center justify-between border-b">
            <span className="font-semibold">Notifications</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={loadNotifications} className="h-7 px-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
              <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 px-2 flex items-center">
                <Check className="h-4 w-4 mr-1" /> Mark all
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notifications</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n._id}
                  className={`flex flex-col items-start cursor-pointer py-2 px-3 hover:bg-gray-100 rounded-md ${
                    n.read ? "opacity-70" : "font-medium"
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="text-sm leading-tight">{n.title}</div>
                  <div className="text-xs text-gray-600 leading-snug">{n.message}</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
