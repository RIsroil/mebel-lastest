import styles from './StatCard.module.css'
import { cn } from '@/utils/cn'

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeNeg?: boolean
  icon?: string
  className?: string
}

const StatCard = ({ label, value, change, changeNeg, icon, className }: StatCardProps) => (
  <div className={cn(styles.card, className)}>
    {icon && <div className={styles.icon}>{icon}</div>}
    <div className={styles.label}>{label}</div>
    <div className={styles.value}>{value}</div>
    {change && (
      <div className={cn(styles.change, changeNeg && styles.neg)}>{change}</div>
    )}
  </div>
)

export default StatCard
