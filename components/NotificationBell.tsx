"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

import { notificationsApi, type NotificationItem } from "@/lib/api"
import { useSocket } from "@/contexts/socket-context"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const { socket } = useSocket()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ⚡ Replace this with your real auth/session
  const currentUser = {
    id: "user123",   // Example logged-in user ID
    role: "user",    // or "admin"
  }

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const { notifications } = await notificationsApi.getNotifications({ limit: "30" })

      // ✅ Only include notifications for this user/role
      const filtered = notifications.filter(
        (n) => n.user_id === currentUser.id || n.role === currentUser.role
      )

      setNotifications(filtered)
      setUnreadCount(filtered.filter((n) => !n.read).length)
    } catch (e) {
      console.error("Error loading notifications:", e)
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id)
      if (!unreadIds.length) return

      await notificationsApi.markRead(unreadIds)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (e) {
      console.error("Error marking all read:", e)
    }
  }

  const handleNotificationClick = async (n: NotificationItem) => {
    try {
      if (!n.read) {
        await notificationsApi.markRead([n._id])
        setNotifications((prev) =>
          prev.map((notif) => (notif._id === n._id ? { ...notif, read: true } : notif))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      }

      if (n.issue_id) {
        router.push(`/issues/${n.issue_id}`)
        setOpen(false)
      }
    } catch (e) {
      console.error("Error handling notification click:", e)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handler = (data: any) => {
      // ✅ Skip if notification is not for this user/role
      if (data.user_id && data.user_id !== currentUser.id) return
      if (data.role && data.role !== currentUser.role) return

      const item: NotificationItem = {
        _id: data._id || Math.random().toString(36).slice(2),
        title: data.title || "Notification",
        message: data.message || "",
        read: false,
        issue_id: data.issue_id,
        created_at: data.created_at || new Date().toISOString(),
      }

      setNotifications((prev) => [item, ...prev].slice(0, 50))
      setUnreadCount((c) => c + 1)
    }

    socket.on("notification", handler)
    return () => {
      socket.off("notification", handler)
    }
  }, [socket])

  // Close dropdown on outside click
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
      <button
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1 min-w-[18px] text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed top-16 right-4 w-80 bg-white border rounded-lg shadow-lg z-50">
          <div className="px-3 py-2 flex items-center justify-between border-b">
            <span className="font-medium">Notifications</span>
            <div className="flex items-center gap-1">
              <button
                className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-100 rounded"
                onClick={loadNotifications}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </button>
              <button
                className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-100 rounded"
                onClick={markAllRead}
              >
                <Check className="h-4 w-4" /> Mark all
              </button>
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
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex flex-col p-3 cursor-pointer hover:bg-gray-100 ${
                    n.read ? "opacity-70" : ""
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="text-sm font-medium leading-tight">{n.title}</div>
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
