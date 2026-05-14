import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTopbar } from '@/context/TopbarContext'
import { logApi } from '@/api/log.api'
import type { FinancialLogType, FinancialLogResponse } from '@/types/log.types'
import { formatNumber } from '@/utils/formatMoney'
import { toApiDate } from '@/utils/formatDate'
import styles from './LogsPage.module.css'

const TYPE_LABEL: Record<FinancialLogType, string> = {
  WAREHOUSE_PURCHASE: 'Xomashyo xaridi',
  MATERIAL_USED:      'Xomashyo sarflandi',
  WAGE_PAID:          'Maosh',
  COMMISSION_PAID:    'Komissiya',
  BONUS_PAID:         'Bonus',
  FURNITURE_SOLD:     'Mebel sotildi',
}
const TYPE_CLASS: Record<FinancialLogType, string> = {
  WAREHOUSE_PURCHASE: 'expense',
  MATERIAL_USED:      'expense',
  WAGE_PAID:          'expense',
  COMMISSION_PAID:    'expense',
  BONUS_PAID:         'expense',
  FURNITURE_SOLD:     'income',
}

const firstOfMonth = () => {
  const d = new Date()
  d.setDate(1)
  return toApiDate(d)
}

const PAGE_SIZE = 30

const NAV_PATH: Partial<Record<FinancialLogType, string>> = {
  WAREHOUSE_PURCHASE: '/warehouse',
  MATERIAL_USED:      '/orders',
  FURNITURE_SOLD:     '/orders',
}

function LogNavLink({ log }: { log: FinancialLogResponse }) {
  const navigate = useNavigate()
  const base = NAV_PATH[log.logType]
  if (!base || !log.referenceId) return null
  return (
    <button
      type="button"
      onClick={() => navigate(`${base}/${log.referenceId}`)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, padding: '2px 6px', borderRadius: 4, textDecoration: 'underline' }}
    >
      {log.relatedName ?? '→'}
    </button>
  )
}

const LogsPage = () => {
  const { setTitle, setActions } = useTopbar()

  const today = toApiDate(new Date())
  const [from, setFrom]   = useState(firstOfMonth())
  const [to, setTo]       = useState(today)
  const [type, setType]   = useState<FinancialLogType | ''>('')
  const [page, setPage]   = useState(0)

  useEffect(() => {
    setTitle('Moliyaviy jurnal')
    setActions([])
  }, [setTitle, setActions])

  const logsQuery = useQuery({
    queryKey: ['logs', from, to, type, page],
    queryFn: () => logApi.getLogs({
      from, to,
      type: type || undefined,
      page,
      size: PAGE_SIZE,
    }),
  })

  const lastMonthQuery = useQuery({
    queryKey: ['logs-summary-last-month'],
    queryFn: () => logApi.getLastMonthSummary(),
  })

  const periodSummaryQuery = useQuery({
    queryKey: ['logs-summary-period', from, to],
    queryFn: () => logApi.getPeriodSummary(from, to),
    enabled: !!from && !!to,
  })

  const logs     = logsQuery.data?.data?.data?.content ?? []
  const totalPages = logsQuery.data?.data?.data?.totalPages ?? 1
  const lastMonth  = lastMonthQuery.data?.data?.data
  const periodSum  = periodSummaryQuery.data?.data?.data

  const handleFilterChange = () => setPage(0)

  return (
    <div className={styles.page}>
      {/* O'tgan oy xulosasi */}
      {lastMonth && (
        <div className={styles.lastMonthBar}>
          <span className={styles.lastMonthLabel}>O'tgan oy ({lastMonth.period}):</span>
          <span className={styles.incomeChip}>+{formatNumber(lastMonth.totalIncome)} so'm</span>
          <span className={styles.expenseChip}>−{formatNumber(lastMonth.totalExpense)} so'm</span>
          <span className={lastMonth.netAmount >= 0 ? styles.netPositive : styles.netNegative}>
            Sof: {lastMonth.netAmount >= 0 ? '+' : ''}{formatNumber(lastMonth.netAmount)} so'm
          </span>
          <span className={styles.countChip}>{lastMonth.count} ta yozuv</span>
        </div>
      )}

      {/* Filter */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Dan</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); handleFilterChange() }}
                 className={styles.dateInput} />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Gacha</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); handleFilterChange() }}
                 className={styles.dateInput} />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Tur</label>
          <select value={type} onChange={e => { setType(e.target.value as FinancialLogType | ''); handleFilterChange() }}
                  className={styles.selectInput}>
            <option value="">Barchasi</option>
            {(Object.keys(TYPE_LABEL) as FinancialLogType[]).map(t => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tanlangan davr xulosasi */}
      {periodSum && (
        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryVal + ' ' + styles.incomeVal}>+{formatNumber(periodSum.totalIncome)}</div>
            <div className={styles.summaryLbl}>Kirim (so'm)</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryVal + ' ' + styles.expenseVal}>−{formatNumber(periodSum.totalExpense)}</div>
            <div className={styles.summaryLbl}>Chiqim (so'm)</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryVal + ' ' + (periodSum.netAmount >= 0 ? styles.incomeVal : styles.expenseVal)}>
              {periodSum.netAmount >= 0 ? '+' : ''}{formatNumber(periodSum.netAmount)}
            </div>
            <div className={styles.summaryLbl}>Sof foyda (so'm)</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryVal}>{periodSum.count}</div>
            <div className={styles.summaryLbl}>Jami yozuv</div>
          </div>
        </div>
      )}

      {/* Desktop jadval */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Tur</th>
              <th>Izoh</th>
              <th>Havola</th>
              <th className={styles.amountCol}>Miqdor</th>
            </tr>
          </thead>
          <tbody>
            {logsQuery.isLoading && (
              <tr><td colSpan={5} className={styles.empty}>Yuklanmoqda...</td></tr>
            )}
            {!logsQuery.isLoading && logs.length === 0 && (
              <tr><td colSpan={5} className={styles.empty}>Yozuvlar topilmadi</td></tr>
            )}
            {logs.map(log => (
              <tr key={log.id}>
                <td className={styles.dateCell}>{log.logDate}</td>
                <td>
                  <span className={`${styles.typeBadge} ${styles[TYPE_CLASS[log.logType]]}`}>
                    {TYPE_LABEL[log.logType]}
                  </span>
                </td>
                <td className={styles.descCell}>
                  <span className={styles.descText} title={log.description ?? ''}>
                    {log.description ?? '—'}
                  </span>
                </td>
                <td><LogNavLink log={log} /></td>
                <td className={`${styles.amountCol} ${log.amount >= 0 ? styles.amountPos : styles.amountNeg}`}>
                  {log.amount >= 0 ? '+' : ''}{formatNumber(log.amount)} so'm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile kartalar */}
      <div className={styles.logCards}>
        {logsQuery.isLoading && (
          <div className={styles.empty}>Yuklanmoqda...</div>
        )}
        {!logsQuery.isLoading && logs.length === 0 && (
          <div className={styles.empty}>Yozuvlar topilmadi</div>
        )}
        {logs.map(log => (
          <div key={log.id} className={styles.logCard}>
            <div className={styles.logCardTop}>
              <div className={styles.logCardMeta}>
                <span className={styles.logCardDate}>{log.logDate}</span>
                <span className={`${styles.typeBadge} ${styles[TYPE_CLASS[log.logType]]}`}>
                  {TYPE_LABEL[log.logType]}
                </span>
              </div>
              <span className={`${styles.logCardAmount} ${log.amount >= 0 ? styles.amountPos : styles.amountNeg}`}>
                {log.amount >= 0 ? '+' : ''}{formatNumber(log.amount)} so'm
              </span>
            </div>
            <div className={styles.logCardDesc}>{log.description ?? '—'}</div>
            {log.referenceId && (
              <div className={styles.logCardBottom}>
                <LogNavLink log={log} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>
            ‹ Oldingi
          </button>
          <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>
            Keyingi ›
          </button>
        </div>
      )}
    </div>
  )
}

export default LogsPage
