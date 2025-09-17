"use client"

import { ReactNode, createContext, useContext, useState } from "react"

interface DropdownMenuProps {
  children: ReactNode
}

const DropdownContext = createContext<{ open: boolean; setOpen: (v: boolean) => void } | undefined>(undefined)

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  )
}

export function useDropdown() {
  const ctx = useContext(DropdownContext)
  if (!ctx) throw new Error("Dropdown components must be inside DropdownMenu")
  return ctx
}
