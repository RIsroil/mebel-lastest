import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate, toApiDate } from '@/utils/formatDate'
import { attendanceApi } from '@/api/attendance.api'
import type { AssignedWorker, WageBreakdownItem } from '@/types/furniture.types'
import styles from './WorkerEarningsDetailModal.module.css'

interface WorkerEarningsDetailModalProps {
  isOpen: boolean
  onClose: () => void
  worker: AssignedWorker | null
  orderNumber?: string
}

const WorkerEarningsDetailModal = ({
  isOpen,
  onClose,
  worker,
  orderNumber,
}: WorkerEarningsDetailModalProps) => {
  if (!worker) return null

  const isMonthlyWorker = worker.workerPayType === 'MONTHLY'
  const currentAssignments = (worker.otherAssignmentsCount || 0) + 1

  // Full daily rate (before any split)
  let dailyRate = 0
  if (worker.workerDailySalary && worker.workerDailySalary > 0) {
    dailyRate = worker.workerDailySalary
  } else if (worker.workerMonthlySalary && worker.workerMonthlySalary > 0) {
    const daysInMonth = worker.assignedAt
      ? new Date(new Date(worker.assignedAt).getFullYear(), new Date(worker.assignedAt).getMonth() + 1, 0).getDate()
      : 30
    dailyRate = worker.workerMonthlySalary / daysInMonth
  }

  // Date range for calendar
  let attendanceFromDate = ''
  let attendanceToDate = ''
  if (worker.assignedAt) {
    const assignedDate = new Date(worker.assignedAt)
    const endDate = worker.unassignedAt ? new Date(worker.unassignedAt) : new Date()
    attendanceFromDate = toApiDate(assignedDate)
    attendanceToDate = toApiDate(endDate)
  }

  // Fetch attendance for calendar display
  const { data: attendanceResp } = useQuery({
    queryKey: ['attendance', worker.workerId, attendanceFromDate, attendanceToDate],
    queryFn: () =>
      attendanceApi.getWorkerHistory(worker.workerId, {
        from: attendanceFromDate,
        to: attendanceToDate,
      }),
    enabled: !!attendanceFromDate && !!attendanceToDate && isOpen,
  })

  const attendanceData = useMemo(() => {
    const records = attendanceResp?.data?.data ?? []
    return records.map((record) => ({
      date: record.workDate,
      hoursWorked: record.hoursWorked,
    }))
  }, [attendanceResp])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ishchi daromadi tafsilotlari">
      <div className={styles.container}>
        {/* Worker Info */}
        <div className={styles.workerInfo}>
          <Avatar name={worker.workerName || '—'} role="WORKER" size="md" />
          <div className={styles.workerDetails}>
            <div className={styles.workerName}>{worker.workerName || '—'}</div>
            {orderNumber && (
              <div className={styles.orderNumber}>Buyurtma: {orderNumber}</div>
            )}
          </div>
        </div>

        {/* Assignment Info */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📅 Biriktirilish</div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Biriktirilgan:</span>
            <span className={styles.value}>
              {worker.assignedAt ? formatDate(worker.assignedAt) : '—'}
            </span>
          </div>
          {worker.unassignedAt && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Ajratilgan:</span>
              <span className={styles.value}>{formatDate(worker.unassignedAt)}</span>
            </div>
          )}
          <div className={styles.infoRow}>
            <span className={styles.label}>Ishlagan kunlari:</span>
            <span className={styles.value}>{worker.daysWorked} kun</span>
          </div>
          {dailyRate > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Kunlik maosh:</span>
              <span className={styles.value}>{formatNumber(dailyRate)} so'm/kun</span>
            </div>
          )}
        </div>

        {/* Wage calculation explanation */}
        {worker.wageCost > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>💰 Maosh hisoblash</div>
            <div className={styles.calculation}>
              Bu buyurtmaga ketgan maosh: <strong>{formatNumber(worker.wageCost)} so'm</strong>
            </div>
            {currentAssignments > 1 && (
              <div className={styles.note}>
                * Ishchi hozirda {currentAssignments} ta buyurtmada ishlaydi.
                Maosh har kuni uchun buyurtmalar soniga qarab proporsional bo'lingan.
              </div>
            )}
          </div>
        )}

        {/* Wage Breakdown Logs */}
        {worker.wageBreakdown && worker.wageBreakdown.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📋 Kunlik maosh loglari</div>
            <WageBreakdownSummary breakdown={worker.wageBreakdown} />
            <WageBreakdownTable breakdown={worker.wageBreakdown} />
          </div>
        )}

        {/* Commission */}
        {worker.commissionCost > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📊 Komissiya</div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Komissiya foizi:</span>
              <span className={styles.value}>{worker.commissionPct}%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Komissiya summasi:</span>
              <span className={styles.valueCost}>-{formatNumber(worker.commissionCost)} so'm</span>
            </div>
          </div>
        )}

        {/* Total */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📋 Jami</div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Maosh:</span>
            <span className={styles.value}>{formatNumber(worker.wageCost)} so'm</span>
          </div>
          {worker.commissionCost > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Komissiya:</span>
              <span className={styles.valueCost}>-{formatNumber(worker.commissionCost)} so'm</span>
            </div>
          )}
          <div className={styles.infoRow} style={{ fontWeight: 'bold', marginTop: '8px' }}>
            <span className={styles.label}>Jami xarajat:</span>
            <span className={styles.value}>
              {formatNumber(worker.wageCost + worker.commissionCost)} so'm
            </span>
          </div>
        </div>

        {/* Pay Type */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>ℹ️ To'lash turi</div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Tur:</span>
            <span className={styles.value}>
              {isMonthlyWorker ? 'Oylik' : 'Kunlik'}
            </span>
          </div>
        </div>

        {/* Calendar */}
        {worker.assignedAt && worker.daysWorked > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📆 Davomat</div>
            <AssignmentCalendar
              assignedAt={worker.assignedAt}
              unassignedAt={worker.unassignedAt}
              attendanceData={attendanceData}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}

interface AttendanceDay {
  date: string
  hoursWorked: number | null
}

interface AssignmentCalendarProps {
  assignedAt: string
  unassignedAt: string | null
  attendanceData?: AttendanceDay[]
}

const AssignmentCalendar = ({
  assignedAt,
  unassignedAt,
  attendanceData = [],
}: AssignmentCalendarProps) => {
  const startDate = new Date(assignedAt)
  const endDate = unassignedAt ? new Date(unassignedAt) : new Date()
  const year = startDate.getFullYear()
  const month = startDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const attendanceMap = new Map(
    attendanceData.map((d) => [d.date, d.hoursWorked])
  )

  const isInAssignmentPeriod = (day: number) => {
    const checkDate = new Date(year, month, day)
    return checkDate >= startDate && checkDate <= endDate
  }

  const getHoursForDay = (day: number): number | null => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return attendanceMap.get(dateStr) ?? null
  }

  const dayLabels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

  // Count worked days
  const workedDays = attendanceData.filter(d => {
    const date = new Date(d.date)
    return date >= startDate && date <= endDate && d.hoursWorked && d.hoursWorked > 0
  }).length

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        {dayLabels.map((day) => (
          <div key={day} className={styles.calendarDay}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.calendarGrid}>
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.dayCell} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const inPeriod = isInAssignmentPeriod(day)
          const hours = getHoursForDay(day)
          const hasWorked = hours != null && hours > 0
          return (
            <div
              key={day}
              className={`${styles.dayCell} ${
                hasWorked ? styles.worked : inPeriod ? styles.inPeriod : styles.inactive
              }`}
              title={hasWorked ? `${hours} soat ishlagan` : inPeriod ? 'Ishlamagan' : ''}
            >
              <div className={styles.dayCellDay}>{day}</div>
              {hasWorked && (
                <div className={styles.dayCellHours}>{hours}h</div>
              )}
            </div>
          )
        })}
      </div>
      <div className={styles.calendarNote}>
        Jami {workedDays} kun ishlagan
      </div>
    </div>
  )
}

interface WageBreakdownProps {
  breakdown: WageBreakdownItem[]
}

const WageBreakdownSummary = ({ breakdown }: WageBreakdownProps) => {
  const grouped = useMemo(() => {
    const map = new Map<number, { count: number; rate: number; total: number }>()
    for (const item of breakdown) {
      const key = item.activeAssignments
      const existing = map.get(key) ?? { count: 0, rate: item.earnedAmount, total: 0 }
      existing.count++
      existing.total += item.earnedAmount
      map.set(key, existing)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([assignments, data]) => ({
        assignments,
        days: data.count,
        dailyRate: data.total / data.count,
        total: data.total,
      }))
  }, [breakdown])

  if (grouped.length <= 1) return null

  return (
    <div className={styles.breakdownSummary}>
      {grouped.map((g) => (
        <div key={g.assignments} className={styles.summaryChip}>
          <span className={styles.chipCount}>{g.days} kun</span>
          <span className={styles.chipRate}>@ {formatNumber(g.dailyRate)} so'm</span>
          <span className={styles.chipTotal}>= {formatNumber(g.total)} so'm</span>
        </div>
      ))}
    </div>
  )
}

const WageBreakdownTable = ({ breakdown }: WageBreakdownProps) => {
  const hasHours = breakdown.some(item => item.hoursWorked != null)

  return (
    <table className={styles.breakdownTable}>
      <thead>
        <tr>
          <th>Sana</th>
          {hasHours && <th>Soat</th>}
          <th>Buyurtmalar</th>
          <th>Kunlik</th>
          <th>Olgan</th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((item) => {
          const hoursRatio = item.hoursWorked != null && item.hoursTarget != null && item.hoursTarget > 0
            ? item.hoursWorked / item.hoursTarget
            : 1
          const isPartial = hoursRatio < 1

          return (
            <tr key={item.date}>
              <td>{formatDate(item.date)}</td>
              {hasHours && (
                <td style={{ color: isPartial ? 'var(--accent)' : 'var(--text)' }}>
                  {item.hoursWorked != null
                    ? `${item.hoursWorked}/${item.hoursTarget}h`
                    : '—'}
                </td>
              )}
              <td>
                <span
                  className={`${styles.assignmentBadge} ${
                    item.activeAssignments === 1 ? styles.single : styles.multiple
                  }`}
                >
                  {item.activeAssignments}
                </span>
              </td>
              <td>{formatNumber(item.fullDailyRate)}</td>
              <td>{formatNumber(item.earnedAmount)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default WorkerEarningsDetailModal
