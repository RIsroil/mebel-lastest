import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/auth.types'

interface Props {
  allowed: UserRole[]
}

const ROLE_HOME: Record<UserRole, string> = {
  OWNER:  '/dashboard',
  WORKER: '/weekly-attendance',
  ADMIN:  '/admin/users',
}

/** Faqat ruxsat etilgan rollar uchun guard */
const RoleRoute = ({ allowed }: Props) => {
  const role = useAuthStore((s) => s.user?.role)
  if (!role) return <Navigate to="/login" replace />
  if (allowed.includes(role)) return <Outlet />
  return <Navigate to={ROLE_HOME[role] ?? '/unauthorized'} replace />
}

export default RoleRoute
