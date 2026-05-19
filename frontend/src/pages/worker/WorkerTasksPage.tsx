import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { useTopbar } from '@/context/TopbarContext'
import { furnitureApi } from '@/api/furniture.api'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate } from '@/utils/formatDate'
import Badge from '@/components/ui/Badge'
import styles from './WorkerTasksPage.module.css'

const WorkerTasksPage = () => {
  const { user } = useAuthStore()
  const { setTitle } = useTopbar()

  const { data: ordersResp, isLoading } = useQuery({
    queryKey: ['workerOrders', user?.id],
    queryFn: () => furnitureApi.orders.getAll(),
    enabled: !!user?.id,
  })

  const orders = ordersResp?.data?.data ?? []

  // Filter orders assigned to current worker
  const assignedOrders = user?.id
    ? orders.filter(
        (order) => order.assignedWorkers?.some((w) => w.workerId === user.id)
      )
    : []

  useEffect(() => {
    setTitle("Men ishlaydigan buyurtmalar")
    return () => setTitle('')
  }, [setTitle])

  if (isLoading) {
    return <div className={styles.loading}>Yuklanmoqda...</div>
  }

  return (
    <div className={styles.page}>
      {assignedOrders.length === 0 ? (
        <div className={styles.empty}>
          <p>Hali buyurtma biriktirilmagan</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {assignedOrders.map((order) => {
            const assignment = order.assignedWorkers?.find((w) => w.workerId === user?.id)
            if (!assignment) return null

            return (
              <div key={order.id} className={styles.card}>
                {/* Header with status */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>{order.title}</div>
                  <Badge variant={order.status} />
                </div>

                {/* Order info */}
                <div className={styles.cardInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Raqam:</span>
                    <span className={styles.value}>{order.orderNumber}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Sotish narxi:</span>
                    <span className={styles.value}>{formatNumber(order.salePrice)} UZS</span>
                  </div>
                  {order.clientName && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Mijoz:</span>
                      <span className={styles.value}>{order.clientName}</span>
                    </div>
                  )}
                  {order.startedAt && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Boshlangan:</span>
                      <span className={styles.value}>{formatDate(order.startedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Assignment info */}
                <div className={styles.divider} />
                <div className={styles.assignmentSection}>
                  <div className={styles.sectionTitle}>Mening vazifam</div>

                  {assignment.daysWorked > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Ishlagan kunlar:</span>
                      <span className={styles.valueBold}>{assignment.daysWorked} kun</span>
                    </div>
                  )}

                  {assignment.wageCost > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Maosh:</span>
                      <span className={styles.valueCost}>{formatNumber(assignment.wageCost)} UZS</span>
                    </div>
                  )}

                  {assignment.commissionPct != null && assignment.commissionPct > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Komissiya:</span>
                      <span className={styles.valueAccent}>{assignment.commissionPct}%</span>
                    </div>
                  )}

                  {assignment.commissionCost > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Komissiya summa:</span>
                      <span className={styles.valueCost}>{formatNumber(assignment.commissionCost)} UZS</span>
                    </div>
                  )}

                  {assignment.assignedAt && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Biriktirilgan:</span>
                      <span className={styles.valueSmall}>{formatDate(assignment.assignedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Order summary */}
                <div className={styles.divider} />
                <div className={styles.summarySection}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Material xarajat</span>
                    <span className={styles.summaryCost}>{formatNumber(order.actualMaterialCost)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Sof foyda</span>
                    <span
                      className={styles.summaryCost}
                      style={{ color: order.netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}
                    >
                      {formatNumber(order.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WorkerTasksPage
