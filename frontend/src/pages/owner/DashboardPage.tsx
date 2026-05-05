import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTopbar } from '@/context/TopbarContext'
import { furnitureApi } from '@/api/furniture.api'
import { warehouseApi } from '@/api/warehouse.api'
import { attendanceApi } from '@/api/attendance.api'
import { adminApi } from '@/api/admin.api'
import { toApiDate, formatTime } from '@/utils/formatDate'
import { formatNumber } from '@/utils/formatMoney'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import styles from './DashboardPage.module.css'

const DashboardPage = () => {
  const { setTitle, setActions } = useTopbar()
  const today = toApiDate(new Date())

  useEffect(() => {
    setTitle('Dashboard')
    setActions(
      <Link to="/orders">
        <Button size="sm">+ Buyurtma</Button>
      </Link>
    )
    return () => {
      setTitle('')
      setActions(null)
    }
  }, [setTitle, setActions])

  const { data: ordersResp, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: furnitureApi.orders.getAll,
  })

  const { data: itemsResp } = useQuery({
    queryKey: ['warehouseItems'],
    queryFn: warehouseApi.items.getAll,
  })

  const { data: attendanceResp } = useQuery({
    queryKey: ['attendance', today],
    queryFn: () => attendanceApi.getWorkshopByDate(today),
  })

  const { data: workersResp } = useQuery({
    queryKey: ['workers'],
    queryFn: () => adminApi.users.getAll({ role: 'WORKER', size: 100 }),
  })

  const orders    = ordersResp?.data?.data    ?? []
  const items     = itemsResp?.data?.data     ?? []
  const attendance = attendanceResp?.data?.data ?? []
  const workers   = workersResp?.data?.data?.content ?? []

  const activeOrders  = orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'DRAFT')
  const warehouseValue = items.reduce((sum, i) => sum + i.totalValue, 0)
  const lowStockItems  = items.filter((i) => i.lowStock)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyRevenue = orders
    .filter((o) => o.status === 'SOLD' && o.soldAt && new Date(o.soldAt) >= monthStart)
    .reduce((sum, o) => sum + o.salePrice, 0)

  const workerMap = new Map(workers.map((w) => [w.id, w]))

  return (
    <div>
      <div className={styles.statGrid}>
        <StatCard
          label="Faol buyurtmalar"
          value={activeOrders.length}
          change={`${orders.filter((o) => o.status === 'IN_PROGRESS').length} ta jarayonda`}
          icon="🛋️"
        />
        <StatCard
          label="Ombor qiymati"
          value={formatNumber(warehouseValue)}
          change="UZS"
          icon="📦"
        />
        <StatCard
          label="Ishchilar (bugun)"
          value={attendance.length}
          change={`${attendance.length} ta keldi`}
          icon="👷"
        />
        <StatCard
          label="Bu oy daromad"
          value={formatNumber(monthlyRevenue)}
          change="UZS"
          icon="💰"
        />
      </div>

      <div className={styles.mainGrid}>
        {/* Active orders table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Faol buyurtmalar</span>
            <Link to="/orders" className={styles.viewAll}>Barchasi →</Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Raqam</th>
                <th>Mebel</th>
                <th>Mijoz</th>
                <th>Status</th>
                <th>Narx</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.slice(0, 6).map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderNum}>{order.orderNumber}</td>
                  <td>{order.title}</td>
                  <td>{order.clientName ?? '—'}</td>
                  <td><Badge variant={order.status} /></td>
                  <td className={styles.price}>{formatNumber(order.salePrice)}</td>
                  <td>
                    <Link to={`/orders/${order.id}`} className={styles.detailBtn}>→</Link>
                  </td>
                </tr>
              ))}
              {!isLoading && activeOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>Faol buyurtmalar yo'q</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          {/* Today's attendance */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>📅 Bugungi davomat</div>
            {attendance.length === 0 ? (
              <p className={styles.emptySmall}>Hali hech kim kelmadi</p>
            ) : (
              <div className={styles.workerList}>
                {attendance.map((a) => {
                  const worker = workerMap.get(a.userId)
                  const name   = worker?.fullName || worker?.username || '...'
                  return (
                    <div key={a.id} className={styles.workerRow}>
                      <Avatar name={name} role="WORKER" size="sm" />
                      <div className={styles.workerInfo}>
                        <div className={styles.workerName}>{name}</div>
                        <div className={styles.workerTime}>{formatTime(a.checkInTime)} da keldi</div>
                      </div>
                      <span className={styles.checkMark}>✓</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Low stock */}
          {lowStockItems.length > 0 && (
            <div className={styles.infoCard}>
              <div className={styles.infoCardTitle} style={{ color: 'var(--red)' }}>
                ⚠ Kam qolgan materiallar
              </div>
              <div className={styles.stockList}>
                {lowStockItems.map((item) => (
                  <div key={item.id} className={styles.stockRow}>
                    <span className={styles.stockName}>{item.name}</span>
                    <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 12 }}>
                      {item.quantity} / min:{item.minQuantityAlert}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
