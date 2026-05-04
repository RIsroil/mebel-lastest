import type { ReactNode } from 'react'
import styles from './AuthCard.module.css'

interface Props {
  title:    string
  subtitle: string
  children: ReactNode
  titleColor?: string
  icon?: ReactNode
}

const AuthCard = ({ title, subtitle, children, titleColor, icon }: Props) => (
  <div className={styles.card}>
    <div className={styles.logo}>
      {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
      <div className={styles.logoText} style={titleColor ? { color: titleColor } : undefined}>
        {title}
      </div>
      <div className={styles.logoSub}>{subtitle}</div>
    </div>
    {children}
  </div>
)

export default AuthCard
