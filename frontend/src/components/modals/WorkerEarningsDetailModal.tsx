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
  const dailyEarnings = monthlySalary / 30
  const totalAssignments = (worker.otherAssignmentsCount || 0) + 1
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
        </div>

        {/* Salary Calculation */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>💰 Oylik maosh hisoblash</div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Oylik maosh:</span>
            <span className={styles.value}>{formatNumber(monthlySalary)} so'm</span>
          </div>
          <div className={styles.calculation}>
            {formatNumber(monthlySalary)} ÷ 30 kun = {formatNumber(dailyEarnings)} so'm/kun
          </div>
        </div>

        {/* Multiple Assignments */}
        {totalAssignments > 1 && (
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
                dailyEarnings / totalAssignments
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
      </div>
    </Modal>
  )
}

export default WorkerEarningsDetailModal
