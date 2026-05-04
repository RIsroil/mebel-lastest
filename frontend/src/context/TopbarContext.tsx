import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface TopbarCtx {
  title:      string
  actions:    ReactNode
  setTitle:   (t: string) => void
  setActions: (node: ReactNode) => void
}

const TopbarContext = createContext<TopbarCtx | null>(null)

export const TopbarProvider = ({ children }: { children: ReactNode }) => {
  const [title,   setTitle]   = useState('')
  const [actions, setActions] = useState<ReactNode>(null)

  return (
    <TopbarContext.Provider value={{ title, actions, setTitle, setActions }}>
      {children}
    </TopbarContext.Provider>
  )
}

/** Sahifa komponentlarida topbar title/actions o'rnatish uchun */
export const useTopbar = () => {
  const ctx = useContext(TopbarContext)
  if (!ctx) throw new Error('useTopbar must be used inside TopbarProvider')
  return ctx
}
