import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate } from '@/utils/formatDate'
import type { AssignedWorker } from '@/types/furniture.types'
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

  const monthlySalary = worker.workerMonthlySalary || 0
  const isMonthlyWorker = worker.workerPayType === 'MONTHLY'
  const totalAssignments = (worker.otherAssignmentsCount || 0) + 1

  // Calculate days in month based on assignedAt
  let daysInMonth = 30
  if (worker.assignedAt) {
    const assignedDate = new Date(worker.assignedAt)
    const year = assignedDate.getFullYear()
    const month = assignedDate.getMonth()
    daysInMonth = new Date(year, month + 1, 0).getDate()
  }

  // Calculate daily earnings
  let dailyEarnings = 0
  if (isMonthlyWorker) {
    dailyEarnings = monthlySalary / daysInMonth
  } else if (worker.daysWorked > 0 && worker.wageCost > 0) {
    // For daily workers: daily rate = wageCost / daysWorked
    dailyEarnings = worker.wageCost / worker.daysWorked
  }

  // For multiple assignments, split the earnings
  const displayedDailyEarnings = dailyEarnings / totalAssignments
  const splitPercentage = totalAssignments > 1 ? (100 / totalAssignments).toFixed(0) : 100

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

        {/* Assignment Dates */}
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
              <span className={styles.label}>Biriktirilganliği bekor qilingan:</span>
              <span className={styles.value}>{formatDate(worker.unassignedAt)}</span>
            </div>
          )}
          {worker.daysWorked > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Ish kunlari:</span>
              <span className={styles.value}>{worker.daysWorked} kun</span>
            </div>
          )}
          {worker.daysWorked > 0 && dailyEarnings > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Kunlik daromadi:</span>
              <span className={styles.value}>{formatNumber(displayedDailyEarnings)} so'm/kun</span>
            </div>
          )}
        </div>

        {/* Salary Calculation - Only for monthly workers */}
        {isMonthlyWorker && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>💰 Oylik maosh hisoblash</div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Oylik maosh:</span>
              <span className={styles.value}>{formatNumber(monthlySalary)} so'm</span>
            </div>
            <div className={styles.calculation}>
              {formatNumber(monthlySalary)} ÷ {daysInMonth} kun = {formatNumber(dailyEarnings)} so'm/kun
            </div>
            {worker.daysWorked > 0 && (
              <div className={styles.calculation} style={{ marginTop: '8px' }}>
                {formatNumber(dailyEarnings)} × {worker.daysWorked} kun = {formatNumber(
                  dailyEarnings * worker.daysWorked
                )} so'm
                {totalAssignments > 1 && (
                  <>
                    <br />÷ {totalAssignments} = {formatNumber(
                      (dailyEarnings * worker.daysWorked) / totalAssignments
                    )} so'm (bu loyihaga)
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multiple Assignments */}
        {totalAssignments > 1 && dailyEarnings > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>🔀 Bir kunga biriktirilgan maxsulotlar</div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Maxsulotlar soni:</span>
              <span className={styles.value}>{totalAssignments} ta</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Kunlik daromad split:</span>
              <span className={styles.value}>{splitPercentage}% har bir maxsulot uchun</span>
            </div>
            <div className={styles.calculation}>
              {formatNumber(dailyEarnings)} ÷ {totalAssignments} = {formatNumber(
                displayedDailyEarnings
              )} so'm/kun (har bir maxsulot)
            </div>
          </div>
        )}

        {/* Total Costs */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📊 Jami xarajat</div>
          {worker.wageCost > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Jami maosh:</span>
              <span className={styles.valueCost}>
                -{formatNumber(worker.wageCost)} so'm
              </span>
            </div>
          )}
          {worker.commissionCost > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Jami komissiya:</span>
              <span className={styles.valueCost}>
                -{formatNumber(worker.commissionCost)} so'm
              </span>
            </div>
          )}
          {worker.wageCost === 0 && worker.commissionCost === 0 && (
            <div className={styles.empty}>Hali xarajat yo'q</div>
          )}
        </div>

        {/* Pay Type Info */}
        {worker.workerPayType && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>ℹ️ To'lash turi</div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Tur:</span>
              <span className={styles.value}>
                {worker.workerPayType === 'DAILY' ? 'Kunlik' : 'Oylik'}
              </span>
            </div>
          </div>
        )}

        {/* Assignment Period Calendar */}
        {worker.assignedAt && worker.daysWorked > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📆 Biriktirilish davri</div>
            <AssignmentCalendar
              assignedAt={worker.assignedAt}
              unassignedAt={worker.unassignedAt}
              daysWorked={worker.daysWorked}
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
  daysWorked: number
  attendanceData?: AttendanceDay[]
}

const AssignmentCalendar = ({
  assignedAt,
  unassignedAt,
  daysWorked,
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
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`
    return attendanceMap.get(dateStr) ?? null
  }

  const dayLabels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

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
          return (
            <div
              key={day}
              className={`${styles.dayCell} ${
                inPeriod ? styles.worked : styles.inactive
              }`}
              title={inPeriod ? 'Biriktirilish davri' : 'Tashqarida'}
            >
              <div className={styles.dayCellDay}>{day}</div>
              {hours != null && inPeriod && (
                <div className={styles.dayCellHours}>{hours}h</div>
              )}
            </div>
          )
        })}
      </div>
      <div className={styles.calendarNote}>
        Jami {daysWorked} kun ish qilgan
      </div>
    </div>
  )
}

export default WorkerEarningsDetailModal
