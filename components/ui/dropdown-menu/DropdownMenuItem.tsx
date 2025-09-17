"use client"

import { ReactNode } from "react"

interface DropdownMenuItemProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function DropdownMenuItem({ children, className = "", onClick }: DropdownMenuItemProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${className}`}
    >
      {children}
    </div>
  )
}
