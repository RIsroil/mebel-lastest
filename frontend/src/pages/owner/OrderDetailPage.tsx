import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Image as ImageIcon, Trash2, X as XIcon, User, TrendingUp, Wrench } from 'lucide-react'
import { useTopbar } from '@/context/TopbarContext'
import { furnitureApi } from '@/api/furniture.api'
import { warehouseApi } from '@/api/warehouse.api'
import { adminApi } from '@/api/admin.api'
import type { FurnitureStatus, AssignedWorker } from '@/types/furniture.types'
import type { UnitType } from '@/types/warehouse.types'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate, formatDateTime } from '@/utils/formatDate'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import WorkerEarningsDetailModal from '@/components/modals/WorkerEarningsDetailModal'
import styles from './OrderDetailPage.module.css'

interface MaterialRow {
  warehouseItemId: string
  quantityUsed: string
  notes: string
  lengthMm?: string
  widthMm?: string
  heightMm?: string
}

const emptyMaterialRow = (): MaterialRow => ({ warehouseItemId: '', quantityUsed: '', notes: '' })

function isMaterialRowValid(row: MaterialRow) {
  return row.warehouseItemId !== '' && parseFloat(row.quantityUsed) > 0
}

const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: 'PIECE',  label: 'Dona (PIECE)' },
  { value: 'M2',     label: 'Kvadrat metr (M2)' },
  { value: 'METER',  label: 'Metr (METER)' },
  { value: 'M3',     label: 'Kub metr (M3)' },
  { value: 'KG',     label: 'Kilogram (KG)' },
  { value: 'GRAM',   label: 'Gram (GRAM)' },
  { value: 'LITRE',  label: 'Litr (LITRE)' },
  { value: 'ML',     label: 'Millilitr (ML)' },
  { value: 'CM',     label: 'Santimetr (CM)' },
]

const NEXT_STATUSES: Record<FurnitureStatus, FurnitureStatus[]> = {
  DRAFT:       ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED:   ['SOLD'],
  SOLD:        [],
  CANCELLED:   [],
}

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const { setTitle, setActions } = useTopbar()

  const [showStatusMenu,   setShowStatusMenu]   = useState(false)
  const [showAddMaterial,  setShowAddMaterial]  = useState(false)
  const [materialRows,     setMaterialRows]     = useState<MaterialRow[]>([emptyMaterialRow()])
  const [showAssignWorker, setShowAssignWorker] = useState(false)
  const [assignWorkerData, setAssignWorkerData] = useState<{ workerId: string; commissionPct: string } | null>(null)
  const [lightboxUrl,      setLightboxUrl]      = useState<string | null>(null)
  const [confirmDelete,    setConfirmDelete]    = useState<{ usageId: string; itemName: string } | null>(null)
  const [selectedWorker,   setSelectedWorker]   = useState<AssignedWorker | null>(null)

  // Yangi material (warehouse item) yaratish uchun
  const [newItemForRowIdx, setNewItemForRowIdx] = useState<number | null>(null)
  const [newItemName,      setNewItemName]      = useState('')
  const [newItemUnitType,  setNewItemUnitType]  = useState<UnitType>('PIECE')
  const [newItemQty,       setNewItemQty]       = useState('')
  const [newItemPrice,     setNewItemPrice]     = useState('')

  const statusMenuRef  = useRef<HTMLDivElement>(null)
  const imageInputRef  = useRef<HTMLInputElement>(null)

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
    mutationFn: (body: { warehouseItemId: string; quantityUsed: number; notes?: string }) =>
      furnitureApi.orders.addMaterial(id!, body),
  })

  const removeMaterialMutation = useMutation({
    mutationFn: (usageId: string) => furnitureApi.orders.removeMaterial(id!, usageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['warehouseItems'] })
      queryClient.invalidateQueries({ queryKey: ['warehouseTodayOut'] })
    },
  })

  const adjustMaterialMutation = useMutation({
    mutationFn: ({ usageId, delta }: { usageId: string; delta: number }) =>
      furnitureApi.orders.adjustMaterial(id!, usageId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['warehouseItems'] })
      queryClient.invalidateQueries({ queryKey: ['warehouseTodayOut'] })
    },
  })

  const createWarehouseItemMutation = useMutation({
    mutationFn: async ({ name, unitType, qty, price }: { name: string; unitType: UnitType; qty: number; price: number }) => {
      const res = await warehouseApi.items.create({ name, unitType })
      const newItemId = res.data.data.id
      if (qty > 0) {
        await warehouseApi.transactions.create(newItemId, {
          transactionType: 'IN',
          quantity: qty,
          unitPrice: price,
        })
      }
      return newItemId
    },
    onSuccess: (newItemId) => {
      queryClient.invalidateQueries({ queryKey: ['warehouseItems'] })
      if (newItemForRowIdx !== null) {
        setMaterialRows((r) => r.map((m, i) => i === newItemForRowIdx ? { ...m, warehouseItemId: newItemId } : m))
      }
      setNewItemForRowIdx(null)
      setNewItemName('')
      setNewItemUnitType('PIECE')
      setNewItemQty('')
      setNewItemPrice('')
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

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => furnitureApi.orders.uploadImage(id!, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  })

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => furnitureApi.orders.deleteImage(id!, imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
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
              <span className={styles.tableTitle}><Wrench size={18} style={{ display: 'inline-block', marginRight: 8 }} />Sarflangan materiallar</span>
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
                  {order.status === 'IN_PROGRESS' && <th></th>}
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
                    {order.status === 'IN_PROGRESS' && (
                      <td>
                        <div className={styles.matActions}>
                          <button
                            type="button"
                            className={`${styles.matActionBtn} ${styles.matActionBtnAdd}`}
                            title="+1 qo'shish"
                            disabled={adjustMaterialMutation.isPending}
                            onClick={() => adjustMaterialMutation.mutate({ usageId: m.id, delta: 1 })}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className={`${styles.matActionBtn} ${styles.matActionBtnRemove}`}
                            title="-1 kamaytirish"
                            disabled={adjustMaterialMutation.isPending || m.quantityUsed <= 1}
                            onClick={() => adjustMaterialMutation.mutate({ usageId: m.id, delta: -1 })}
                          >
                            −
                          </button>
                          <button
                            type="button"
                            className={`${styles.matActionBtn} ${styles.matActionBtnDelete}`}
                            title="Butunlay olib tashlash"
                            disabled={removeMaterialMutation.isPending}
                            onClick={() => setConfirmDelete({ usageId: m.id, itemName: m.itemName ?? '—' })}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {order.materialUsages.length === 0 && (
                  <tr>
                    <td colSpan={order.status === 'IN_PROGRESS' ? 7 : 6} className={styles.empty}>Material qo'shilmagan</td>
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

          {/* Images section */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}><ImageIcon size={18} style={{ display: 'inline-block', marginRight: 8 }} />Tayyor mahsulot rasmlari</span>
              {(order.images ?? []).length < 3 && order.status !== 'CANCELLED' && (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadImageMutation.mutate(file)
                      e.target.value = ''
                    }}
                  />
                  <Button
                    size="sm"
                    loading={uploadImageMutation.isPending}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    + Rasm yuklash ({(order.images ?? []).length}/3)
                  </Button>
                </>
              )}
            </div>
            <div className={styles.imageGrid}>
              {(order.images ?? []).length === 0 ? (
                <p className={styles.empty}>Rasm yuklanmagan</p>
              ) : (
                (order.images ?? []).map((img) => (
                  <div key={img.id} className={styles.imageItem}>
                    <img
                      src={img.url}
                      alt={img.originalFilename}
                      className={styles.imageThumbnail}
                      onClick={() => setLightboxUrl(img.url)}
                    />
                    <button
                      type="button"
                      className={styles.imageDelete}
                      onClick={() => deleteImageMutation.mutate(img.id)}
                      title="O'chirish"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className={styles.rightCol}>
          {/* Order info */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>📋</span> Buyurtma ma'lumoti</div>
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
            <div className={styles.infoCardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} /> Biriktirilgan ishchilar</div>
            {order.assignedWorkers.map((w) => (
              <div
                key={w.workerId}
                className={styles.workerItem}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedWorker(w)}
              >
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
                  onClick={(e) => {
                    e.stopPropagation()
                    removeWorkerMutation.mutate(w.workerId)
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            {order.assignedWorkers.length === 0 && (
              <p className={styles.empty}>Ishchi biriktirilmagan</p>
            )}
            {availableWorkers.length > 0 && order.status !== 'SOLD' && order.status !== 'CANCELLED' && (
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
            <div className={styles.infoCardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} /> Foydalilik</div>
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

      {/* Add material modal — batch */}
      <Modal
        isOpen={showAddMaterial}
        onClose={() => { setShowAddMaterial(false); setMaterialRows([emptyMaterialRow()]) }}
        title="Material qo'shish"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
          {materialRows.map((row, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 12,
                background: 'var(--surface2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--text3)',
                  background: 'var(--border)', width: 22, height: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                }}>
                  {idx + 1}
                </span>
                {materialRows.length > 1 && (
                  <button
                    type="button"
                    style={{
                      width: 26, height: 26, border: '1px solid var(--border)',
                      borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--text3)',
                    }}
                    onClick={() => setMaterialRows((r) => r.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </button>
                )}
              </div>
              {idx === 0 && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Material *</label>
                  <select
                    className={styles.formSelect}
                    value={row.warehouseItemId}
                    onChange={(e) =>
                      setMaterialRows((r) => r.map((m, i) => i === idx ? { ...m, warehouseItemId: e.target.value } : m))
                    }
                  >
                    <option value="">Tanlang...</option>
                    {items.filter((i) => i.active).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} {item.unitType})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setNewItemForRowIdx(idx) }}
                    style={{
                      marginTop: 4, background: 'none', border: 'none',
                      color: 'var(--accent)', fontSize: 12, cursor: 'pointer',
                      padding: '2px 0', textAlign: 'left',
                    }}
                  >
                    + Omborxonada yo'q? Yangi material qo'shish
                  </button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Miqdor *</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    step="0.01"
                    placeholder="1.0"
                    value={row.quantityUsed}
                    onChange={(e) =>
                      setMaterialRows((r) => r.map((m, i) => i === idx ? { ...m, quantityUsed: e.target.value } : m))
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Izoh</label>
                  <input
                    className={styles.formInput}
                    placeholder="Ixtiyoriy..."
                    value={row.notes}
                    onChange={(e) =>
                      setMaterialRows((r) => r.map((m, i) => i === idx ? { ...m, notes: e.target.value } : m))
                    }
                  />
                </div>
              </div>

              {/* Dimension fields */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  📐 O'lchami (ixtiyoriy)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bo'yi (mm)</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      placeholder="2400"
                      value={row.lengthMm || ''}
                      onChange={(e) =>
                        setMaterialRows((r) => r.map((m, i) => i === idx ? { ...m, lengthMm: e.target.value } : m))
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Eni (mm)</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      placeholder="600"
                      value={row.widthMm || ''}
                      onChange={(e) =>
                        setMaterialRows((r) => r.map((m, i) => i === idx ? { ...m, widthMm: e.target.value } : m))
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Balandligi (mm)</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      placeholder="18"
                      value={row.heightMm || ''}
                      onChange={(e) =>
                        setMaterialRows((r) => r.map((m, i) => i === idx ? { ...m, heightMm: e.target.value } : m))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const firstMaterialId = materialRows[0]?.warehouseItemId || ''
              const newRow = emptyMaterialRow()
              if (firstMaterialId) {
                newRow.warehouseItemId = firstMaterialId
              }
              setMaterialRows((r) => [...r, newRow])
            }}
            style={{
              width: '100%', padding: 10,
              border: '1.5px dashed var(--border)', borderRadius: 8,
              background: 'transparent', color: 'var(--accent)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Yana bir material qo'shish
          </button>
        </div>

        <div className={styles.formActions} style={{ marginTop: 12 }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setShowAddMaterial(false); setMaterialRows([emptyMaterialRow()]) }}
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            size="sm"
            loading={addMaterialMutation.isPending}
            disabled={!materialRows.some(isMaterialRowValid)}
            onClick={async () => {
              const validRows = materialRows.filter(isMaterialRowValid)
              for (const row of validRows) {
                await addMaterialMutation.mutateAsync({
                  warehouseItemId: row.warehouseItemId,
                  quantityUsed: parseFloat(row.quantityUsed),
                  notes: row.notes || undefined,
                })
              }
              queryClient.invalidateQueries({ queryKey: ['order', id] })
              queryClient.invalidateQueries({ queryKey: ['warehouseItems'] })
              queryClient.invalidateQueries({ queryKey: ['warehouseTodayOut'] })
              setShowAddMaterial(false)
              setMaterialRows([emptyMaterialRow()])
            }}
          >
            {materialRows.filter(isMaterialRowValid).length} ta material qo'shish →
          </Button>
        </div>
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

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            className={styles.lightboxImage}
            alt="rasm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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

      {/* Custom confirm: butunlay o'chirish */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>🗑</div>
            <div className={styles.confirmTitle}>Materialni olib tashlash</div>
            <div className={styles.confirmMsg}>
              <strong>"{confirmDelete.itemName}"</strong> ni buyurtmadan butunlay olib tashlash va omborga qaytarish?
            </div>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setConfirmDelete(null)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className={styles.confirmOk}
                disabled={removeMaterialMutation.isPending}
                onClick={() => {
                  removeMaterialMutation.mutate(confirmDelete.usageId)
                  setConfirmDelete(null)
                }}
              >
                Ha, olib tashlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yangi warehouse material yaratish modal */}
      <Modal
        isOpen={newItemForRowIdx !== null}
        onClose={() => {
          setNewItemForRowIdx(null)
          setNewItemName('')
          setNewItemUnitType('PIECE')
          setNewItemQty('')
          setNewItemPrice('')
        }}
        title="Yangi material qo'shish"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>
            Bu material omborxonaga ham qo'shiladi
          </p>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Material nomi *</label>
            <input
              className={styles.formInput}
              placeholder="Masalan: LDSP 18mm, Vintlar..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>O'lchov birligi *</label>
            <select
              className={styles.formSelect}
              value={newItemUnitType}
              onChange={(e) => setNewItemUnitType(e.target.value as UnitType)}
            >
              {UNIT_TYPES.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Boshlang'ich miqdor</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.01"
                placeholder="0"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Birlik narxi (UZS)</label>
              <input
                className={styles.formInput}
                type="number"
                placeholder="0"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewItemForRowIdx(null)
                setNewItemName('')
                setNewItemUnitType('PIECE')
                setNewItemQty('')
                setNewItemPrice('')
              }}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              size="sm"
              loading={createWarehouseItemMutation.isPending}
              disabled={!newItemName.trim()}
              onClick={() => {
                createWarehouseItemMutation.mutate({
                  name: newItemName.trim(),
                  unitType: newItemUnitType,
                  qty: parseFloat(newItemQty) || 0,
                  price: parseFloat(newItemPrice) || 0,
                })
              }}
            >
              Yaratish va tanlash →
            </Button>
          </div>
        </div>
      </Modal>

      <WorkerEarningsDetailModal
        isOpen={selectedWorker !== null}
        onClose={() => setSelectedWorker(null)}
        worker={selectedWorker}
        orderNumber={order?.orderNumber}
      />
    </div>
  )
}

export default OrderDetailPage
