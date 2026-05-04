import styles from './Badge.module.css'
import { cn } from '@/utils/cn'

type BadgeVariant =
  | 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SOLD' | 'CANCELLED'
  | 'PAID' | 'UNPAID'
  | 'ACTIVE' | 'BLOCKED'

const LABELS: Record<BadgeVariant, string> = {
  DRAFT:       'DRAFT',
  IN_PROGRESS: 'IN PROGRESS',
  COMPLETED:   'COMPLETED',
  SOLD:        'SOLD',
  CANCELLED:   'CANCELLED',
  PAID:        'TO\'LANGAN',
  UNPAID:      'TO\'LANMAGAN',
  ACTIVE:      'ACTIVE',
  BLOCKED:     'BLOCKED',
}

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

const Badge = ({ variant, label, className }: BadgeProps) => (
  <span className={cn(styles.badge, styles[variant], className)}>
    {label ?? LABELS[variant]}
  </span>
)

export default Badge
