"use client"

import { ReactNode, useEffect, useRef } from "react"
import { useDropdown } from "./DropdownMenu"

interface DropdownMenuContentProps {
  children: ReactNode
  align?: "start" | "end"
  className?: string
}

export function DropdownMenuContent({ children, align = "start", className = "" }: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdown()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setOpen])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-2 ${align === "end" ? "right-0" : "left-0"} ${className}`}
    >
      {children}
    </div>
  )
}
