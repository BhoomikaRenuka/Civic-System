"use client"

import { ReactNode } from "react"

interface DropdownMenuLabelProps {
  children: ReactNode
  className?: string
}

export function DropdownMenuLabel({ children, className = "" }: DropdownMenuLabelProps) {
  return <div className={`text-gray-500 text-sm font-semibold ${className}`}>{children}</div>
}
