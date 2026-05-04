import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/auth.types'
import styles from './AuthLayout.module.css'

const ROLE_HOME: Record<UserRole, string> = {
  OWNER:  '/dashboard',
  WORKER: '/check-in',
  ADMIN:  '/admin/users',
}

const AuthLayout = () => {
  const { isAuthenticated, user } = useAuthStore()

  // Allaqachon kirgan foydalanuvchini uning sahifasiga yo'naltirish
  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME[user.role]} replace />
  }

  return (
    <div className={styles.wrap}>
      <Outlet />
    </div>
  )
}

export default AuthLayout
