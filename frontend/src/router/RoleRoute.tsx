import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/auth.types'

interface Props {
  allowed: UserRole[]
}

/** Faqat ruxsat etilgan rollar uchun guard */
const RoleRoute = ({ allowed }: Props) => {
  const role = useAuthStore((s) => s.user?.role)
  if (!role) return <Navigate to="/login" replace />
  return allowed.includes(role) ? <Outlet /> : <Navigate to="/login" replace />
}

export default RoleRoute
