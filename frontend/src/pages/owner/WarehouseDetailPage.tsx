import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTopbar } from '@/context/TopbarContext'
import { warehouseApi } from '@/api/warehouse.api'
import type { TransactionType } from '@/types/warehouse.types'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate } from '@/utils/formatDate'
import Button from '@/components/ui/Button'
import styles from './WarehouseDetailPage.module.css'

const UNIT_LABELS: Record<string, string> = {
  PIECE: 'Dona', KG: 'Kg', METER: 'Metr', LITER: 'Litr',
  SQUARE_METER: 'M²', CUBIC_METER: 'M³', PACK: 'Paket', SET: "To'plam", OTHER: 'Boshqa',
}

const TX_LABEL: Record<TransactionType, string> = {
  IN: 'Kirim', OUT: 'Chiqim', ADJUSTMENT: "Tuzatish",
}
const TX_CLASS: Record<TransactionType, string> = {
  IN: 'txIn', OUT: 'txOut', ADJUSTMENT: 'txAdj',
}

const WarehouseDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setTitle, setActions } = useTopbar()

  const { data: itemResp, isLoading: itemLoading } = useQuery({
    queryKey: ['warehouseItem', id],
    queryFn:  () => warehouseApi.items.getById(id!),
    enabled:  !!id,
  })

  const { data: txResp, isLoading: txLoading } = useQuery({
    queryKey: ['warehouseTransactions', id],
    queryFn:  () => warehouseApi.transactions.getByItem(id!),
    enabled:  !!id,
  })

  const item         = itemResp?.data
  const transactions = txResp?.data ?? []

  useEffect(() => {
    setTitle(item?.name ?? 'Ombor')
    setActions(
      <Button size="sm" variant="ghost" onClick={() => navigate('/warehouse')}>
        ← Omborga qaytish
      </Button>
    )
    return () => { setTitle(''); setActions(null) }
  }, [item, setTitle, setActions, navigate])

  if (itemLoading) {
    return <div className={styles.loading}>Yuklanmoqda...</div>
  }
  if (!item) {
    return <div className={styles.loading}>Material topilmadi</div>
  }

  const totalIn  = transactions.filter((t) => t.transactionType === 'IN').reduce((s, t) => s + t.quantity, 0)
  const totalOut = transactions.filter((t) => t.transactionType === 'OUT').reduce((s, t) => s + t.quantity, 0)

  return (
    <div>
      {/* Item header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div>
            <div className={styles.headerName}>{item.name}</div>
            {item.sku && <div className={styles.headerSku}>SKU: {item.sku}</div>}
            {item.description && <div className={styles.headerDesc}>{item.description}</div>}
          </div>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Mavjud miqdor</span>
              <span className={`${styles.statValue} ${item.lowStock ? styles.lowValue : ''}`}>
                {formatNumber(item.quantity)} {UNIT_LABELS[item.unitType] ?? item.unitType}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>O'rtacha narx</span>
              <span className={styles.statValue}>{formatNumber(item.avgUnitPrice)} so'm</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Umumiy qiymat</span>
              <span className={styles.statValue}>{formatNumber(item.totalValue)} so'm</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Jami kirim</span>
              <span className={styles.statValueGreen}>{formatNumber(totalIn)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Jami chiqim</span>
              <span className={styles.statValueRed}>{formatNumber(totalOut)}</span>
            </div>
          </div>
        </div>
        {item.lowStock && (
          <div className={styles.lowAlert}>
            ⚠ Kam qoldi! Minimal: {item.minQuantityAlert} {UNIT_LABELS[item.unitType] ?? item.unitType}
          </div>
        )}
      </div>

      {/* Transactions table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>Tranzaksiyalar tarixi</span>
          <span className={styles.txCount}>{transactions.length} ta yozuv</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Tur</th>
              <th>Miqdor</th>
              <th>Oldin → Keyin</th>
              <th>Birlik narxi</th>
              <th>Umumiy</th>
              <th>Yetkazuvchi</th>
              <th>Hisob-faktura</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className={styles.dateCell}>{formatDate(tx.createdAt)}</td>
                <td>
                  <span className={`${styles.txBadge} ${styles[TX_CLASS[tx.transactionType]]}`}>
                    {TX_LABEL[tx.transactionType]}
                  </span>
                </td>
                <td className={styles.qtyCell}>
                  {tx.transactionType === 'OUT' ? '-' : '+'}
                  {formatNumber(tx.quantity)}
                </td>
                <td className={styles.arrowCell}>
                  {formatNumber(tx.qtyBefore)} → {formatNumber(tx.qtyAfter)}
                </td>
                <td>{formatNumber(tx.unitPrice)}</td>
                <td className={styles.totalCell}>{formatNumber(tx.totalCost)}</td>
                <td>{tx.supplierName ?? '—'}</td>
                <td className={styles.invoiceCell}>{tx.invoiceNumber ?? '—'}</td>
              </tr>
            ))}
            {!txLoading && transactions.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Tranzaksiyalar mavjud emas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WarehouseDetailPage
