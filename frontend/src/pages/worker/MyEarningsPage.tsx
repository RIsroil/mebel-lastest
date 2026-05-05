import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTopbar } from '@/context/TopbarContext'
import { earningApi } from '@/api/earning.api'
import type { EarnType } from '@/types/earning.types'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate, toApiDate } from '@/utils/formatDate'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import styles from './MyEarningsPage.module.css'

const EARN_LABELS: Record<EarnType, string> = {
  DAILY_WAGE:  'Kunlik',
  HOURLY_WAGE: 'Soatlik',
  COMMISSION:  'Komissiya',
  BONUS:       'Bonus',
}
const EARN_CLASS: Record<EarnType, string> = {
  DAILY_WAGE:  'earnDaily',
  HOURLY_WAGE: 'earnHourly',
  COMMISSION:  'earnComm',
  BONUS:       'earnBonus',
}

const DAYS = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']
const DAY_NAMES = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba']

const MyEarningsPage = () => {
  const { setTitle, setActions } = useTopbar()

  const today = toApiDate(new Date())
  // Joriy oy boshidan
  const monthStart = (() => { const d = new Date(); d.setDate(1); return toApiDate(d) })()
  // So'nggi 7 kun uchun
  const sevenDaysAgo = toApiDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))

  const { data: allResp, isLoading: allLoading } = useQuery({
    queryKey: ['my-earnings', monthStart, today],
    queryFn:  () => earningApi.getMyEarnings({ from: monthStart, to: today }),
  })

  const { data: weekResp } = useQuery({
    queryKey: ['my-earnings-week', sevenDaysAgo, today],
    queryFn:  () => earningApi.getMyEarnings({ from: sevenDaysAgo, to: today }),
  })

  useEffect(() => {
    setTitle('Mening daromadlarim')
    setActions(null)
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const earnings     = allResp?.data?.data  ?? []
  const weekEarnings = weekResp?.data?.data ?? []

  const stats = useMemo(() => {
    const total  = earnings.reduce((s, e) => s + e.totalAmount, 0)
    const paid   = earnings.filter((e) => e.paid).reduce((s, e) => s + e.totalAmount, 0)
    const unpaid = total - paid
    return { total, paid, unpaid }
  }, [earnings])

  // So'nggi 7 kun: kunlik jami guruhlangan
  const barData = useMemo(() => {
    const days: { date: string; label: string; dayShort: string; total: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso     = toApiDate(d)
      const dayIdx  = d.getDay()
      const total   = weekEarnings
        .filter((e) => e.earnDate.startsWith(iso))
        .reduce((s, e) => s + e.totalAmount, 0)
      days.push({ date: iso, label: DAY_NAMES[dayIdx], dayShort: DAYS[dayIdx], total })
    }
    const max = Math.max(...days.map((d) => d.total), 1)
    return days.map((d) => ({ ...d, pct: Math.round((d.total / max) * 100) }))
  }, [weekEarnings])

  return (
    <div>
      {/* Stats */}
      <div className={styles.statGrid}>
        <StatCard label="Bu oy jami"    value={formatNumber(stats.total)}  change="UZS" icon="💰" />
        <StatCard label="To'langan"      value={formatNumber(stats.paid)}   change="UZS" icon="✅" />
        <StatCard label="Kutilayotgan"   value={formatNumber(stats.unpaid)} change="UZS" icon="⏳" />
      </div>

      {/* 7 kunlik bar chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>So'nggi 7 kun</div>
        <div className={styles.bars}>
          {barData.map((d) => (
            <div key={d.date} className={styles.barCol}>
              <div className={styles.barWrap}>
                {d.total > 0 && (
                  <div className={styles.barTooltip}>{formatNumber(d.total)}</div>
                )}
                <div
                  className={styles.bar}
                  style={{ height: `${Math.max(d.pct, d.total > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className={styles.barLabel}>{d.dayShort}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>Bu oy barcha daromadlar</span>
          <span className={styles.txCount}>{earnings.length} ta yozuv</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Tur</th>
              <th>Tafsilot</th>
              <th>Summa</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((e) => (
              <tr key={e.id}>
                <td className={styles.dateCell}>{formatDate(e.earnDate)}</td>
                <td>
                  <span className={`${styles.earnBadge} ${styles[EARN_CLASS[e.earnType]]}`}>
                    {EARN_LABELS[e.earnType]}
                  </span>
                </td>
                <td className={styles.descCell}>
                  {e.earnType === 'DAILY_WAGE' && e.daysWorked != null &&
                    `${e.daysWorked} kun × ${formatNumber(e.dailyRate ?? 0)}`}
                  {e.earnType === 'HOURLY_WAGE' && e.hoursWorked != null &&
                    `${e.hoursWorked} soat × ${formatNumber(e.hourlyRate ?? 0)}`}
                  {e.earnType === 'COMMISSION' && e.commissionPct != null &&
                    `${e.commissionPct}% komissiya`}
                  {e.earnType === 'BONUS' && (e.description ?? 'Bonus')}
                </td>
                <td className={styles.amountCell}>{formatNumber(e.totalAmount)}</td>
                <td>
                  <Badge variant={e.paid ? 'PAID' : 'UNPAID'} />
                </td>
              </tr>
            ))}
            {!allLoading && earnings.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Bu oy daromad yozuvlari yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MyEarningsPage
