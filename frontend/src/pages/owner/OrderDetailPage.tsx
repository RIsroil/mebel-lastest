import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTopbar } from '@/context/TopbarContext'
import { furnitureApi } from '@/api/furniture.api'
import { warehouseApi } from '@/api/warehouse.api'
import { adminApi } from '@/api/admin.api'
import type { FurnitureStatus } from '@/types/furniture.types'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate, formatDateTime } from '@/utils/formatDate'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import styles from './OrderDetailPage.module.css'

const NEXT_STATUSES: Record<FurnitureStatus, FurnitureStatus[]> = {
  DRAFT:       ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED:   ['SOLD', 'IN_PROGRESS'],
  SOLD:        [],
  CANCELLED:   ['DRAFT'],
}

const materialSchema = z.object({
  warehouseItemId: z.string().min(1, 'Material tanlang'),
  quantityUsed:    z.coerce.number().min(0.01, 'Miqdor kiritish shart'),
  notes:           z.string().optional(),
})

type MaterialFormData = z.infer<typeof materialSchema>

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const { setTitle, setActions } = useTopbar()

  const [showStatusMenu,   setShowStatusMenu]   = useState(false)
  const [showAddMaterial,  setShowAddMaterial]  = useState(false)
  const [showAssignWorker, setShowAssignWorker] = useState(false)
  const [assignWorkerData, setAssignWorkerData] = useState<{ workerId: string; commissionPct: string } | null>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  const { data: orderResp, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => furnitureApi.orders.getById(id!),
    enabled: !!id,
  })

  const { data: itemsResp } = useQuery({
    queryKey: ['warehouseItems'],
    queryFn: warehouseApi.items.getAll,
  })

  const { data: workersResp } = useQuery({
    queryKey: ['workers'],
    queryFn: () => adminApi.users.getAll({ role: 'WORKER', size: 100 }),
  })

  const changeStatusMutation = useMutation({
    mutationFn: (status: FurnitureStatus) =>
      furnitureApi.orders.changeStatus(id!, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  })
  const changeStatusMutate = changeStatusMutation.mutate

  const addMaterialMutation = useMutation({
    mutationFn: (body: MaterialFormData) =>
      furnitureApi.orders.addMaterial(id!, {
        warehouseItemId: body.warehouseItemId,
        quantityUsed:    body.quantityUsed,
        notes:           body.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['warehouseItems'] })
      setShowAddMaterial(false)
      materialForm.reset()
    },
  })

  const assignWorkerMutation = useMutation({
    mutationFn: (body: { workerId: string; commissionPct?: number | null }) =>
      furnitureApi.orders.assignWorker(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setShowAssignWorker(false)
      setAssignWorkerData(null)
    },
  })

  const removeWorkerMutation = useMutation({
    mutationFn: (workerId: string) =>
      furnitureApi.orders.removeWorker(id!, workerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  })

  const materialForm = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema) as Resolver<MaterialFormData>,
  })

  const order   = orderResp?.data?.data
  const items   = itemsResp?.data?.data ?? []
  const workers = workersResp?.data?.data?.content ?? []

  const assignedIds = new Set((order?.assignedWorkers ?? []).map((w) => w.workerId))
  const availableWorkers = workers.filter((w) => !assignedIds.has(w.id))

  const totalCosts = order
    ? order.actualMaterialCost + order.workerWageCost + order.workerCommissionCost
    : 0
  const costPct = order && order.salePrice > 0
    ? Math.round((totalCosts / order.salePrice) * 100)
    : 0

  // Close status menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!order) return
    const nextStatuses = NEXT_STATUSES[order.status]
    setTitle(order.orderNumber)
    setActions(
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge variant={order.status} />
        {nextStatuses.length > 0 && (
          <div className={styles.statusMenu} ref={statusMenuRef}>
            <Button
              size="sm"
              onClick={() => setShowStatusMenu((v) => !v)}
            >
              Status ↓
            </Button>
            {showStatusMenu && (
              <div className={styles.statusDropdown}>
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.statusOption}
                    onClick={() => {
                      changeStatusMutate(s)
                      setShowStatusMenu(false)
                    }}
                  >
                    <Badge variant={s} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
    return () => {
      setTitle('')
      setActions(null)
    }
  }, [order, showStatusMenu, changeStatusMutate])

  if (isLoading) return <p style={{ padding: 24, color: 'var(--text3)' }}>Yuklanmoqda...</p>
  if (!order)    return <p style={{ padding: 24, color: 'var(--red)' }}>Buyurtma topilmadi</p>

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
          ← Orqaga
        </Button>
      </div>

      {order.status === 'DRAFT' && (
        <div style={{ marginBottom: 16, padding: '14px 20px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>Buyurtma hali boshlanmagan</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Ishni boshlash uchun quyidagi tugmani bosing</div>
          </div>
          <Button
            onClick={() => changeStatusMutate('IN_PROGRESS')}
            loading={changeStatusMutation.isPending}
          >
            Ishni boshlash →
          </Button>
        </div>
      )}

      <div className={styles.detailLayout}>
        {/* ── Left column ── */}
        <div className={styles.leftCol}>
          {/* Materials table */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>🔩 Sarflangan materiallar</span>
              {order.status === 'IN_PROGRESS' && (
                <Button size="sm" onClick={() => setShowAddMaterial(true)}>
                  + Material qo'shish
                </Button>
              )}
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Miqdor</th>
                  <th>Birlik narx</th>
                  <th>Jami</th>
                  <th>Vaqt</th>
                  <th>Izoh</th>
                </tr>
              </thead>
              <tbody>
                {order.materialUsages.map((m) => (
                  <tr key={m.id}>
                    <td>{m.itemName}</td>
                    <td>{m.quantityUsed}{m.unitType ? ` ${m.unitType}` : ''}</td>
                    <td>{formatNumber(m.unitPriceAtTime)}</td>
                    <td style={{ fontWeight: 700 }}>{formatNumber(m.totalCost)}</td>
                    <td style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {m.givenAt ? formatDateTime(m.givenAt) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 160 }}>
                      {m.notes || '—'}
                    </td>
                  </tr>
                ))}
                {order.materialUsages.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>Material qo'shilmagan</td>
                  </tr>
                )}
              </tbody>
            </table>
            {order.materialUsages.length > 0 && (
              <div className={styles.tableFooter}>
                Jami xarajat:
                <span className={styles.totalCost}>
                  {formatNumber(order.actualMaterialCost)} UZS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className={styles.rightCol}>
          {/* Order info */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>📋 Buyurtma ma'lumoti</div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Mebel</span>
              <span className={styles.infoVal}>{order.title}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Raqam</span>
              <span className={styles.infoValAccent}>{order.orderNumber}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Sotish narxi</span>
              <span className={styles.infoVal}>{formatNumber(order.salePrice)} UZS</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Material xarajat</span>
              <span className={styles.infoVal}>{formatNumber(order.actualMaterialCost)} UZS</span>
            </div>
            {(order.clientName || order.clientPhone) && (
              <>
                <div className={styles.divider} />
                {order.clientName && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Mijoz</span>
                    <span className={styles.infoVal}>{order.clientName}</span>
                  </div>
                )}
                {order.clientPhone && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Telefon</span>
                    <span className={styles.infoVal}>{order.clientPhone}</span>
                  </div>
                )}
              </>
            )}
            {order.startedAt && (
              <>
                <div className={styles.divider} />
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Boshlangan</span>
                  <span className={styles.infoVal}>{formatDate(order.startedAt)}</span>
                </div>
              </>
            )}
          </div>

          {/* Workers */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>👷 Biriktirilgan ishchilar</div>
            {order.assignedWorkers.map((w) => (
              <div key={w.workerId} className={styles.workerItem}>
                <Avatar name={w.workerName} role="WORKER" size="sm" />
                <div style={{ flex: 1 }}>
                  <div className={styles.workerName}>{w.workerName ?? '—'}</div>
                  <div className={styles.workerDate}>
                    {w.assignedAt ? formatDate(w.assignedAt) + ' dan' : ''}
                    {w.commissionPct != null && w.commissionPct > 0 && (
                      <span style={{ marginLeft: 8, color: 'var(--accent)', fontSize: 11 }}>
                        {w.commissionPct}% komissiya
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {w.daysWorked > 0 && (
                      <span>{w.daysWorked} kun</span>
                    )}
                    {w.wageCost > 0 && (
                      <span style={{ color: 'var(--red)' }}>maosh: -{formatNumber(w.wageCost)}</span>
                    )}
                    {w.commissionCost > 0 && (
                      <span style={{ color: 'var(--red)' }}>komissiya: -{formatNumber(w.commissionCost)}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeWorkerMutation.mutate(w.workerId)}
                >
                  ✕
                </Button>
              </div>
            ))}
            {order.assignedWorkers.length === 0 && (
              <p className={styles.empty}>Ishchi biriktirilmagan</p>
            )}
            {availableWorkers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                onClick={() => setShowAssignWorker(true)}
              >
                + Ishchi biriktirish
              </Button>
            )}
          </div>

          {/* Profitability */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>📈 Foydalilik</div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Sotish narxi</span>
              <span className={styles.infoVal}>{formatNumber(order.salePrice)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Material</span>
              <span style={{ color: 'var(--red)', fontWeight: 600 }}>
                -{formatNumber(order.actualMaterialCost)}
              </span>
            </div>
            {order.workerWageCost > 0 && (
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Ishchi maoshi</span>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>
                  -{formatNumber(order.workerWageCost)}
                </span>
              </div>
            )}
            {order.workerCommissionCost > 0 && (
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Komissiyalar</span>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>
                  -{formatNumber(order.workerCommissionCost)}
                </span>
              </div>
            )}
            <div className={styles.divider} />
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Sof foyda</span>
              <span
                className={styles.infoVal}
                style={{
                  color: order.netProfit >= 0 ? 'var(--green)' : 'var(--red)',
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {formatNumber(order.netProfit)}
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.max(0, Math.min(100 - costPct, 100))}%` }}
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
              Xarajatlar jami: {costPct}% · Foyda: {Math.max(0, 100 - costPct)}%
            </div>
          </div>
        </div>
      </div>

      {/* Add material modal */}
      <Modal
        isOpen={showAddMaterial}
        onClose={() => { setShowAddMaterial(false); materialForm.reset() }}
        title="Material qo'shish"
      >
        <form
          onSubmit={materialForm.handleSubmit((data) => addMaterialMutation.mutate(data))}
          noValidate
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Material *</label>
            <select
              className={styles.formSelect}
              {...materialForm.register('warehouseItemId')}
            >
              <option value="">Tanlang...</option>
              {items.filter((i) => i.active && i.quantity > 0).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.quantity} {item.unitType})
                </option>
              ))}
            </select>
            {materialForm.formState.errors.warehouseItemId && (
              <span style={{ fontSize: 11, color: 'var(--red)' }}>
                {materialForm.formState.errors.warehouseItemId.message}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Miqdor *</label>
            <input
              className={styles.formInput}
              type="number"
              step="0.01"
              placeholder="1.0"
              {...materialForm.register('quantityUsed')}
            />
            {materialForm.formState.errors.quantityUsed && (
              <span style={{ fontSize: 11, color: 'var(--red)' }}>
                {materialForm.formState.errors.quantityUsed.message}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Izoh</label>
            <input
              className={styles.formInput}
              placeholder="Ixtiyoriy..."
              {...materialForm.register('notes')}
            />
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setShowAddMaterial(false); materialForm.reset() }}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={addMaterialMutation.isPending}
            >
              Qo'shish →
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign worker — worker tanlash */}
      <Modal
        isOpen={showAssignWorker && assignWorkerData === null}
        onClose={() => setShowAssignWorker(false)}
        title="Ishchi tanlash"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {availableWorkers.map((w) => (
            <div
              key={w.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onClick={() => setAssignWorkerData({ workerId: w.id, commissionPct: String(w.commissionPct ?? '') })}
            >
              <Avatar name={w.fullName || w.username} role="WORKER" size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {w.fullName || w.username}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  @{w.username}
                  {w.commissionPct != null && w.commissionPct > 0 && (
                    <span style={{ marginLeft: 8, color: 'var(--accent)' }}>
                      Komissiya: {w.commissionPct}%
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--text3)' }}>→</span>
            </div>
          ))}
          {availableWorkers.length === 0 && (
            <p className={styles.empty}>Barcha ishchilar biriktirilgan</p>
          )}
        </div>
      </Modal>

      {/* Assign worker — komissiya tasdiqlash */}
      <Modal
        isOpen={showAssignWorker && assignWorkerData !== null}
        onClose={() => { setAssignWorkerData(null); setShowAssignWorker(false) }}
        title="Komissiya sozlamalari"
      >
        {assignWorkerData && (
          <div>
            {(() => {
              const w = availableWorkers.find((x) => x.id === assignWorkerData.workerId)
              return w ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                  <Avatar name={w.fullName || w.username} role="WORKER" size="sm" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{w.fullName || w.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>@{w.username}</div>
                  </div>
                </div>
              ) : null
            })()}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Komissiya foizi (%)
                <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>
                  0 kiritsangiz komissiya hisoblanmaydi
                </span>
              </label>
              <input
                className={styles.formInput}
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                value={assignWorkerData.commissionPct}
                onChange={(e) => setAssignWorkerData({ ...assignWorkerData, commissionPct: e.target.value })}
              />
            </div>
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAssignWorkerData(null)}
              >
                ← Orqaga
              </Button>
              <Button
                type="button"
                size="sm"
                loading={assignWorkerMutation.isPending}
                onClick={() => {
                  const pct = assignWorkerData.commissionPct === '' ? null : Number(assignWorkerData.commissionPct)
                  assignWorkerMutation.mutate({ workerId: assignWorkerData.workerId, commissionPct: pct })
                }}
              >
                Biriktirish →
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrderDetailPage
