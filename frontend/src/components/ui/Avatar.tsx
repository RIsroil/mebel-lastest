import type { UserRole } from '@/types/auth.types'
import styles from './Avatar.module.css'
import { cn } from '@/utils/cn'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name?: string | null
  role?: UserRole
  size?: AvatarSize
  className?: string
}

const getInitial = (name?: string | null): string => {
  if (!name) return '?'
  return name.trim().charAt(0).toUpperCase()
}

const roleClass: Record<UserRole, string> = {
  OWNER:  styles.owner,
  WORKER: styles.worker,
  ADMIN:  styles.admin,
}

const Avatar = ({ name, role, size = 'md', className }: AvatarProps) => (
  <div
    className={cn(
      styles.avatar,
      styles[size],
      role ? roleClass[role] : styles.default,
      className,
    )}
  >
    {getInitial(name)}
  </div>
)

export default Avatar
