"use client"

import type React from "react"
import { AdminAuthProvider } from "@/contexts/admin-auth-context"
import { AdminSocketProvider } from "@/contexts/admin-socket-context"

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminSocketProvider>{children}</AdminSocketProvider>
    </AdminAuthProvider>
  )
}
