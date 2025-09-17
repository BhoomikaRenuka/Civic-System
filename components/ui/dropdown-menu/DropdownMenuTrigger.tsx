"use client"

import { ReactNode } from "react"
import { useDropdown } from "./DropdownMenu"

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: ReactNode
}

export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdown()
  return (
    <div
  onClick={() => setOpen(!open)}
  className={asChild ? "cursor-pointer" : ""}
>
  {children}
</div>

  )
}
