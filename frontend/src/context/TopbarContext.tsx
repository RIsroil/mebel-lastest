import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface TopbarCtx {
  title:          string
  actions:        ReactNode
  setTitle:       (t: string) => void
  setActions:     (node: ReactNode) => void
  sidebarOpen:    boolean
  setSidebarOpen: (v: boolean) => void
}

const TopbarContext = createContext<TopbarCtx | null>(null)

export const TopbarProvider = ({ children }: { children: ReactNode }) => {
  const [title,       setTitle]       = useState('')
  const [actions,     setActions]     = useState<ReactNode>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <TopbarContext.Provider value={{ title, actions, setTitle, setActions, sidebarOpen, setSidebarOpen }}>
      {children}
    </TopbarContext.Provider>
  )
}

export const useTopbar = () => {
  const ctx = useContext(TopbarContext)
  if (!ctx) throw new Error('useTopbar must be used inside TopbarProvider')
  return ctx
}
