"use client"

import type React from "react"
import { StaffAuthProvider } from "@/contexts/staff-auth-context"
import { StaffSocketProvider } from "@/contexts/staff-socket-context"

export default function StaffRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthProvider>
      <StaffSocketProvider>{children}</StaffSocketProvider>
    </StaffAuthProvider>
  )
}
