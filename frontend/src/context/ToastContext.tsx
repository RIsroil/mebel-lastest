import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id:      number
  message: string
  type:    ToastType
}

interface ToastCtx {
  toasts:  ToastItem[]
  success: (message: string) => void
  error:   (message: string) => void
  info:    (message: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

const AUTO_DISMISS_MS = 3500

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++counter.current
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, AUTO_DISMISS_MS)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{
      toasts,
      success: (m) => add(m, 'success'),
      error:   (m) => add(m, 'error'),
      info:    (m) => add(m, 'info'),
      dismiss,
    }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
