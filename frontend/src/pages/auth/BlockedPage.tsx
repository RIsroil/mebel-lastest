import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatDateTime } from '@/utils/formatDate'
import AuthCard from '@/components/auth/AuthCard'
import Button from '@/components/ui/Button'
import styles from './BlockedPage.module.css'

interface LocationState {
  blockedUntil?: string
  reason?: string
}

const padTwo = (n: number) => String(n).padStart(2, '0')

const calcRemaining = (until: string): string => {
  const diff = new Date(until).getTime() - Date.now()
  if (diff <= 0) return '00:00:00'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`
}

const BlockedPage = () => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = (location.state ?? {}) as LocationState
  const { blockedUntil, reason } = state

  const [countdown, setCountdown] = useState(
    blockedUntil ? calcRemaining(blockedUntil) : '—'
  )

  useEffect(() => {
    if (!blockedUntil) return
    const id = setInterval(() => setCountdown(calcRemaining(blockedUntil)), 1000)
    return () => clearInterval(id)
  }, [blockedUntil])

  return (
    <AuthCard
      title="Hisob bloklangan"
      subtitle={reason ?? "5 marta noto'g'ri parol kiritildi"}
      titleColor="var(--red)"
      icon="🔒"
    >
      <div className={styles.alert}>
        <span className={styles.alertIcon}>⚠</span>
        <div>
          {blockedUntil
            ? <>Hisobingiz <strong>{formatDateTime(blockedUntil)}</strong> gacha bloklangan.</>
            : <>Hisobingiz vaqtincha bloklangan.</>
          }{' '}
          Muammo bo'lsa admin bilan bog'laning.
        </div>
      </div>

      {blockedUntil && (
        <div className={styles.timerBox}>
          <div className={styles.timerLabel}>Qolgan vaqt</div>
          <div className={styles.timerValue}>{countdown}</div>
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="ghost" fullWidth onClick={() => navigate('/login')}>
          ← Orqaga
        </Button>
      </div>
    </AuthCard>
  )
}

export default BlockedPage
