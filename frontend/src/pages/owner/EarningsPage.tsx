import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTopbar } from '@/context/TopbarContext'
import { earningApi } from '@/api/earning.api'
import { adminApi } from '@/api/admin.api'
import { attendanceApi } from '@/api/attendance.api'
import type { EarnType, EarningResponse } from '@/types/earning.types'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate, toApiDate } from '@/utils/formatDate'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import styles from './EarningsPage.module.css'

const EARN_LABELS: Record<EarnType, string> = {
  DAILY_WAGE:   'Kunlik',
  HOURLY_WAGE:  'Soatlik',
  MONTHLY_WAGE: 'Oylik',
  COMMISSION:   'Komissiya',
  BONUS:        'Bonus',
}
const EARN_CLASS: Record<EarnType, string> = {
  DAILY_WAGE:   'earnDaily',
  HOURLY_WAGE:  'earnHourly',
  MONTHLY_WAGE: 'earnMonthly',
  COMMISSION:   'earnComm',
  BONUS:        'earnBonus',
}

function monthlyMeta(e: { daysWorked: number | null; daysInMonth: number | null }) {
  const came = e.daysWorked ?? 0
  const total = e.daysInMonth ?? 30
  const left  = Math.max(0, total - came)
  return { came, left }
}

const firstOfMonth = (): string => {
  const d = new Date()
  d.setDate(1)
  return toApiDate(d)
}

const bonusSchema = z.object({
  workerId:  z.string().min(1, 'Ishchi tanlash shart'),
  amount:    z.coerce.number().min(1, 'Miqdor kiritish shart'),
  reason:    z.string().min(2, 'Sabab kiritish shart'),
  bonusDate: z.string().min(1, 'Sana kiritish shart'),
})
type BonusForm = z.infer<typeof bonusSchema>

const EarningsPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()

  const today = toApiDate(new Date())
  const [from, setFrom]           = useState(firstOfMonth())
  const [to, setTo]               = useState(today)
  const [workerId, setWorkerId]   = useState('')
  const [showBonus, setShowBonus] = useState(false)

  // Override hours modal state
  const [overrideRow, setOverrideRow] = useState<EarningResponse | null>(null)
  const [overrideHours, setOverrideHours] = useState('')

  const { data: workersResp } = useQuery({
    queryKey: ['workers'],
    queryFn:  () => adminApi.users.getAll({ role: 'WORKER', size: 200 }),
  })

  const earningsKey = ['earnings', from, to, workerId]
  const { data: earningsResp, isLoading } = useQuery({
    queryKey: earningsKey,
    queryFn:  () =>
      workerId
        ? earningApi.getWorkerEarnings(workerId, { from, to })
        : earningApi.getWorkshopEarnings({ from, to }),
  })

  const payMut = useMutation({
    mutationFn: (id: string) => earningApi.markPaid(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: earningsKey }),
  })

  const bonusMut = useMutation({
    mutationFn: earningApi.addBonus,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: earningsKey }); closeBonus() },
  })

  const overrideMut = useMutation({
    mutationFn: ({ attendanceId, hours }: { attendanceId: string; hours: number }) =>
      attendanceApi.overrideHours(attendanceId, { hoursWorked: hours }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: earningsKey })
      setOverrideRow(null)
      setOverrideHours('')
    },
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BonusForm>({
    resolver:      zodResolver(bonusSchema) as Resolver<BonusForm>,
    defaultValues: { bonusDate: today },
  })

  useEffect(() => {
    setTitle('Maosh boshqaruvi')
    setActions(
      <Button size="sm" onClick={() => setShowBonus(true)}>+ Bonus berish</Button>
    )
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const closeBonus = () => { setShowBonus(false); reset({ bonusDate: today }) }

  const openOverride = (row: EarningResponse) => {
    setOverrideRow(row)
    setOverrideHours(row.hoursWorked != null ? String(row.hoursWorked) : '')
  }

  const submitOverride = () => {
    if (!overrideRow?.attendanceId) return
    const h = parseFloat(overrideHours)
    if (isNaN(h) || h < 0) return
    overrideMut.mutate({ attendanceId: overrideRow.attendanceId, hours: h })
  }

  const earnings = earningsResp?.data?.data ?? []
  const workers  = workersResp?.data?.data?.content ?? []

  const stats = useMemo(() => {
    const total    = earnings.reduce((s, e) => s + e.totalAmount, 0)
    const paid     = earnings.filter((e) => e.paid).reduce((s, e) => s + e.totalAmount, 0)
    const unpaid   = total - paid
    return { total, paid, unpaid }
  }, [earnings])

  const onBonusSubmit = (data: BonusForm) => {
    bonusMut.mutate({
      workerId:  data.workerId,
      amount:    data.amount,
      reason:    data.reason,
      bonusDate: data.bonusDate,
    })
  }

  return (
    <div>
      {/* Stats */}
      <div className={styles.statGrid}>
        <StatCard label="Jami hisoblangan" value={formatNumber(stats.total)} change="UZS" icon="💰" />
        <StatCard label="To'langan"         value={formatNumber(stats.paid)}  change="UZS" icon="✅" />
        <StatCard label="Kutilayotgan"      value={formatNumber(stats.unpaid)} change="UZS" icon="⏳" />
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Ishchi</label>
          <select
            className={styles.filterSelect}
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
          >
            <option value="">— Barchasi —</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.fullName || w.username}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Dan</label>
          <input
            type="date"
            className={styles.filterDate}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Gacha</label>
          <input
            type="date"
            className={styles.filterDate}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <span className={styles.countHint}>
          {earnings.length} ta yozuv
        </span>
      </div>

      {/* Mobile kartalar */}
      <div className={styles.mobileCards}>
        {!isLoading && earnings.length === 0 && (
          <div className={styles.empty}>Daromad yozuvlari topilmadi</div>
        )}
        {earnings.map((e) => {
          if (e.earnType === 'MONTHLY_WAGE') {
            const { came, left } = monthlyMeta(e)
            return (
              <div key={e.id} className={styles.earnCard}>
                <div className={styles.earnCardTop}>
                  <div className={styles.earnCardLeft}>
                    <span className={styles.earnCardName}>{e.workerName}</span>
                    <span className={styles.earnCardDate}>
                      {came} kun keldi / {left} kun qoldi
                    </span>
                  </div>
                  <span className={`${styles.earnBadge} ${styles[EARN_CLASS[e.earnType]]}`}>
                    {EARN_LABELS[e.earnType]}
                  </span>
                </div>
                <div className={styles.earnCardMid}>
                  <span className={styles.earnCardHours}>
                    Oylik: {e.monthlySalary != null ? formatNumber(e.monthlySalary) : '—'} so'm
                  </span>
                  <span className={styles.earnCardTotal}>{formatNumber(e.totalAmount)} so'm</span>
                </div>
                <div className={styles.earnCardBottom}>
                  <div className={styles.earnCardStatus}>
                    {e.paid
                      ? <span className={styles.paidIcon}>✓</span>
                      : <span className={styles.unpaidIcon}>✗</span>}
                    {e.paid && e.paidAt && (
                      <span className={styles.paidDate}>{formatDate(e.paidAt)}</span>
                    )}
                  </div>
                  {!e.paid && (
                    <button
                      type="button"
                      className={styles.payBtn}
                      disabled={payMut.isPending}
                      onClick={() => payMut.mutate(e.id)}
                    >
                      ✓ To'lash
                    </button>
                  )}
                </div>
              </div>
            )
          }

          const canOverride = (e.earnType === 'DAILY_WAGE' || e.earnType === 'HOURLY_WAGE')
            && e.attendanceId != null
          return (
            <div key={e.id} className={styles.earnCard}>
              <div className={styles.earnCardTop}>
                <div className={styles.earnCardLeft}>
                  <span className={styles.earnCardName}>{e.workerName}</span>
                  <span className={styles.earnCardDate}>{formatDate(e.earnDate)}</span>
                </div>
                <span className={`${styles.earnBadge} ${styles[EARN_CLASS[e.earnType]]}`}>
                  {EARN_LABELS[e.earnType]}
                </span>
              </div>
              <div className={styles.earnCardMid}>
                <div className={styles.earnCardHours}>
                  {e.hoursWorked != null
                    ? `${e.hoursWorked}h${e.hoursTarget != null ? ` / ${e.hoursTarget}h` : ''}`
                    : '—'}
                  {canOverride && (
                    <button
                      type="button"
                      className={styles.editHoursBtn}
                      style={{ opacity: 1 }}
                      onClick={() => openOverride(e)}
                      title="Soatni o'zgartirish"
                    >
                      ✎
                    </button>
                  )}
                </div>
                <span className={styles.earnCardTotal}>{formatNumber(e.totalAmount)} so'm</span>
              </div>
              <div className={styles.earnCardBottom}>
                <div className={styles.earnCardStatus}>
                  {e.paid
                    ? <span className={styles.paidIcon}>✓</span>
                    : <span className={styles.unpaidIcon}>✗</span>}
                  {e.paid && e.paidAt && (
                    <span className={styles.paidDate}>{formatDate(e.paidAt)}</span>
                  )}
                </div>
                {!e.paid && (
                  <button
                    type="button"
                    className={styles.payBtn}
                    disabled={payMut.isPending}
                    onClick={() => payMut.mutate(e.id)}
                  >
                    ✓ To'lash
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ishchi</th>
              <th>Sana</th>
              <th>Tur</th>
              <th>Soat</th>
              <th>To'liq daromand</th>
              <th>Hisoblangan</th>
              <th>Holat</th>
              <th>Amal</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((e) => {
              if (e.earnType === 'MONTHLY_WAGE') {
                const { came, left } = monthlyMeta(e)
                return (
                  <tr key={e.id}>
                    <td className={styles.workerName}>{e.workerName}</td>
                    <td className={styles.dateCell}>
                      <span className={styles.monthlyDays}>
                        {came} kun keldi / {left} kun qoldi
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.earnBadge} ${styles[EARN_CLASS[e.earnType]]}`}>
                        {EARN_LABELS[e.earnType]}
                      </span>
                    </td>
                    <td className={styles.hoursCell}>—</td>
                    <td className={styles.rateCell}>
                      {e.monthlySalary != null && e.daysInMonth != null
                        ? formatNumber((e.monthlySalary / e.daysInMonth) * came)
                        : '—'}
                    </td>
                    <td className={styles.totalCell}>{formatNumber(e.totalAmount)}</td>
                    <td>
                      {e.paid
                        ? <span className={styles.paidIcon}>✓</span>
                        : <span className={styles.unpaidIcon}>✗</span>}
                    </td>
                    <td>
                      {!e.paid && (
                        <button
                          type="button"
                          className={styles.payBtn}
                          disabled={payMut.isPending}
                          onClick={() => payMut.mutate(e.id)}
                        >
                          ✓ To'lash
                        </button>
                      )}
                      {e.paid && e.paidAt && (
                        <span className={styles.paidDate}>{formatDate(e.paidAt)}</span>
                      )}
                    </td>
                  </tr>
                )
              }

              const isOvertime = e.hoursWorked != null && e.hoursTarget != null
                && e.hoursWorked > e.hoursTarget
              const overtimeH = isOvertime
                ? +(e.hoursWorked! - e.hoursTarget!).toFixed(2)
                : 0
              const canOverride = (e.earnType === 'DAILY_WAGE' || e.earnType === 'HOURLY_WAGE')
                && e.attendanceId != null

              return (
              <tr key={e.id}>
                <td className={styles.workerName}>{e.workerName}</td>
                <td className={styles.dateCell}>{formatDate(e.earnDate)}</td>
                <td>
                  <span className={`${styles.earnBadge} ${styles[EARN_CLASS[e.earnType]]}`}>
                    {EARN_LABELS[e.earnType]}
                  </span>
                </td>
                {/* Soat ustuni */}
                <td className={styles.hoursCell}>
                  <div className={styles.hoursCellInner}>
                    {e.hoursWorked != null ? (
                      <span className={isOvertime ? styles.overtime : undefined}>
                        {e.hoursWorked}h{e.hoursTarget != null ? `/${e.hoursTarget}h` : ''}
                        {isOvertime && (
                          <span className={styles.overtimeBadge} title="Qo'shimcha ish vaqti (to'lovga kirmaydi)">
                            +{overtimeH}h
                          </span>
                        )}
                      </span>
                    ) : '—'}
                    {canOverride && (
                      <button
                        type="button"
                        className={styles.editHoursBtn}
                        onClick={() => openOverride(e)}
                        title="Soatni o'zgartirish"
                      >
                        ✎
                      </button>
                    )}
                  </div>
                </td>
                {/* To'liq kun summasi */}
                <td className={styles.rateCell}>
                  {e.earnType === 'DAILY_WAGE' && e.dailyRate != null
                    ? formatNumber(e.dailyRate)
                    : e.earnType === 'HOURLY_WAGE' && e.hourlyRate != null && e.hoursTarget != null
                      ? formatNumber(e.hourlyRate * e.hoursTarget)
                      : '—'}
                </td>
                {/* Hisoblangan */}
                <td className={styles.totalCell}>{formatNumber(e.totalAmount)}</td>
                <td>
                  {e.paid
                    ? <span className={styles.paidIcon}>✓</span>
                    : <span className={styles.unpaidIcon}>✗</span>
                  }
                </td>
                <td>
                  {!e.paid && (
                    <button
                      type="button"
                      className={styles.payBtn}
                      disabled={payMut.isPending}
                      onClick={() => payMut.mutate(e.id)}
                    >
                      ✓ To'lash
                    </button>
                  )}
                  {e.paid && e.paidAt && (
                    <span className={styles.paidDate}>{formatDate(e.paidAt)}</span>
                  )}
                </td>
              </tr>
              )
            })}
            {!isLoading && earnings.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Daromad yozuvlari topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Override hours modal */}
      {overrideRow && (
        <Modal
          isOpen={!!overrideRow}
          onClose={() => { setOverrideRow(null); setOverrideHours('') }}
          title="Ishlangan soatni o'zgartirish"
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {overrideRow.workerName} — {formatDate(overrideRow.earnDate)}
            </label>
            <div className={styles.overrideInputRow}>
              <input
                className={styles.formInput}
                type="number"
                min="0"
                step="0.5"
                placeholder="8"
                value={overrideHours}
                onChange={(e) => setOverrideHours(e.target.value)}
                autoFocus
              />
              <span className={styles.overrideUnit}>soat</span>
            </div>
            {overrideRow.hoursTarget != null && (
              <span className={styles.errText} style={{ color: 'var(--text3)' }}>
                Ish kuni norma: {overrideRow.hoursTarget}h
              </span>
            )}
          </div>
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setOverrideRow(null); setOverrideHours('') }}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              size="sm"
              loading={overrideMut.isPending}
              onClick={submitOverride}
            >
              Saqlash →
            </Button>
          </div>
        </Modal>
      )}

      {/* Bonus modal */}
      <Modal isOpen={showBonus} onClose={closeBonus} title="Bonus berish">
        <form onSubmit={handleSubmit(onBonusSubmit)} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ishchi *</label>
            <select className={styles.formSelect} {...register('workerId')}>
              <option value="">— Ishchi tanlang —</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.fullName || w.username}
                </option>
              ))}
            </select>
            {errors.workerId && <span className={styles.errText}>{errors.workerId.message}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Summa (UZS) *</label>
              <input
                className={styles.formInput}
                type="number"
                placeholder="50000"
                {...register('amount')}
              />
              {errors.amount && <span className={styles.errText}>{errors.amount.message}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sana *</label>
              <input
                className={styles.formInput}
                type="date"
                {...register('bonusDate')}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sabab *</label>
            <input
              className={styles.formInput}
              placeholder="Yaxshi ish uchun mukofot"
              {...register('reason')}
            />
            {errors.reason && <span className={styles.errText}>{errors.reason.message}</span>}
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={closeBonus}>
              Bekor qilish
            </Button>
            <Button type="submit" size="sm" loading={bonusMut.isPending}>
              Bonus berish →
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default EarningsPage
