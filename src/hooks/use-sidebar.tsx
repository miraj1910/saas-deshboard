'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

type SidebarContext = {
  expanded: boolean
  toggle: () => void
  collapse: () => void
  expand: () => void
}

const SidebarCtx = createContext<SidebarContext | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const toggle = useCallback(() => setExpanded((p) => !p), [])
  const collapse = useCallback(() => setExpanded(false), [])
  const expand = useCallback(() => setExpanded(true), [])

  if (!mounted) {
    return (
      <SidebarCtx.Provider value={{ expanded: true, toggle: () => {}, collapse: () => {}, expand: () => {} }}>
        {children}
      </SidebarCtx.Provider>
    )
  }

  return (
    <SidebarCtx.Provider value={{ expanded, toggle, collapse, expand }}>
      {children}
    </SidebarCtx.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarCtx)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
