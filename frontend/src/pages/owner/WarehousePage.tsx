import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTopbar } from '@/context/TopbarContext'
import { warehouseApi } from '@/api/warehouse.api'
import type { UnitType, TransactionType, WarehouseItemResponse } from '@/types/warehouse.types'
import { formatNumber } from '@/utils/formatMoney'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import styles from './WarehousePage.module.css'

const UNIT_LABELS: Record<UnitType, string> = {
  PIECE: 'Dona',
  KG:    'Kg',
  GRAM:  'Gramm',
  LITRE: 'Litr',
  ML:    'Ml',
  METER: 'Metr',
  CM:    'Sm',
  M2:    'M²',
  M3:    'M³',
}
const UNIT_TYPES: UnitType[] = ['PIECE','KG','GRAM','LITRE','ML','METER','CM','M2','M3']
const TX_TYPES: TransactionType[] = ['IN','OUT','ADJUSTMENT']
const TX_LABELS: Record<TransactionType, string> = { IN: 'Kirim', OUT: 'Chiqim', ADJUSTMENT: "Tuzatish" }

const itemSchema = z.object({
  name:              z.string().min(2, 'Kamida 2 ta belgi'),
  description:       z.string().optional(),
  unitType:          z.enum(['PIECE','KG','GRAM','LITRE','ML','METER','CM','M2','M3']),
  sku:               z.string().optional(),
  minQuantityAlert:  z.coerce.number().min(0).optional(),
})
type ItemForm = z.infer<typeof itemSchema>

const txSchema = z.object({
  transactionType: z.enum(['IN','OUT','ADJUSTMENT']),
  quantity:        z.coerce.number().min(0, "Miqdor kiriting"),
  unitPrice:       z.coerce.number().min(0),
  supplierName:    z.string().optional(),
  invoiceNumber:   z.string().optional(),
  notes:           z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.transactionType !== 'ADJUSTMENT' && data.quantity <= 0) {
    ctx.addIssue({ code: 'custom', path: ['quantity'], message: "Miqdor 0 dan katta bo'lishi kerak" })
  }
})
type TxForm = z.infer<typeof txSchema>

const WarehousePage = () => {
  const { setTitle, setActions } = useTopbar()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch]   = useState('')
  const [showItem, setShowItem] = useState(false)
  const [editItem, setEditItem] = useState<WarehouseItemResponse | null>(null)
  const [txItemId, setTxItemId] = useState<string | null>(null)
  const [deleteItem, setDeleteItem] = useState<WarehouseItemResponse | null>(null)

  const { data: itemsResp, isLoading } = useQuery({
    queryKey: ['warehouseItems'],
    queryFn:  warehouseApi.items.getAll,
  })

  const createMut = useMutation({
    mutationFn: warehouseApi.items.create,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['warehouseItems'] }); closeItem() },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ItemForm }) => warehouseApi.items.update(id, body),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['warehouseItems'] }); closeItem() },
  })
  const txMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: TxForm }) => warehouseApi.transactions.create(id, body),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['warehouseItems'] }); closeTx() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => warehouseApi.items.remove(id),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['warehouseItems'] }); setDeleteItem(null) },
  })

  const itemForm = useForm<ItemForm>({
    resolver:      zodResolver(itemSchema) as Resolver<ItemForm>,
    defaultValues: { unitType: 'PIECE', minQuantityAlert: 0 },
  })
  const txForm = useForm<TxForm>({
    resolver:      zodResolver(txSchema) as Resolver<TxForm>,
    defaultValues: { transactionType: 'IN', unitPrice: 0 },
  })

  // Tranzaksiya turi o'zgarganda dinamik UI uchun
  const txType = useWatch({ control: txForm.control, name: 'transactionType' })

  useEffect(() => {
    setTitle('Ombor')
    setActions(
      <Button size="sm" onClick={() => { setEditItem(null); setShowItem(true) }}>
        + Yangi material
      </Button>
    )
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const closeItem = () => {
    setShowItem(false)
    setEditItem(null)
    itemForm.reset({ unitType: 'PIECE', minQuantityAlert: 0 })
  }
  const closeTx = () => {
    setTxItemId(null)
    txForm.reset({ transactionType: 'IN', unitPrice: 0 })
  }

  const openEdit = (item: WarehouseItemResponse) => {
    setEditItem(item)
    itemForm.reset({
      name:             item.name,
      description:      item.description ?? '',
      unitType:         item.unitType,
      sku:              item.sku ?? '',
      minQuantityAlert: item.minQuantityAlert ?? 0,
    })
    setShowItem(true)
  }

  const onItemSubmit = (data: ItemForm) => {
    if (editItem) updateMut.mutate({ id: editItem.id, body: data })
    else          createMut.mutate(data)
  }
  const onTxSubmit = (data: TxForm) => {
    if (txItemId) txMut.mutate({ id: txItemId, body: data })
  }

  const items    = itemsResp?.data?.data ?? []
  const filtered = items.filter((i) => {
    if (!search) return true
    const q = search.toLowerCase()
    return i.name.toLowerCase().includes(q) || (i.sku ?? '').toLowerCase().includes(q)
  })
  const lowStockCount = items.filter((i) => i.lowStock).length
  const negStockCount = items.filter((i) => i.quantity < 0).length

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="🔍 Nomi yoki SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.hint}>
          Jami: <strong>{items.length}</strong> ta
          {negStockCount > 0 && (
            <span className={styles.lowAlert}> · ⚠ {negStockCount} ta yetishmaydi</span>
          )}
          {lowStockCount > 0 && (
            <span className={styles.lowAlert}> · ⚠ {lowStockCount} ta kam qoldi</span>
          )}
        </span>
      </div>

      {/* Desktop jadval */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nomi</th>
              <th>SKU</th>
              <th>Birlik</th>
              <th>Miqdor</th>
              <th>O'rt. narx</th>
              <th>Umumiy qiymat</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td
                  className={styles.itemName}
                  onClick={() => navigate(`/warehouse/${item.id}`)}
                >
                  {item.name}
                  {item.description && (
                    <span className={styles.itemDesc}>{item.description}</span>
                  )}
                </td>
                <td className={styles.sku}>{item.sku ?? '—'}</td>
                <td>{UNIT_LABELS[item.unitType]}</td>
                <td className={item.quantity < 0 ? styles.negQty : item.lowStock ? styles.lowQty : styles.qty}>
                  {formatNumber(item.quantity)}
                  {item.minQuantityAlert != null && item.minQuantityAlert > 0 && (
                    <span className={styles.minHint}> / min: {item.minQuantityAlert}</span>
                  )}
                </td>
                <td>{formatNumber(item.avgUnitPrice)}</td>
                <td className={styles.price}>{formatNumber(item.totalValue)}</td>
                <td>
                  {item.quantity < 0
                    ? <span className={styles.negBadge}>Yetishmaydi</span>
                    : item.lowStock
                      ? <span className={styles.lowBadge}>Kam qoldi</span>
                      : <span className={styles.okBadge}>OK</span>}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.txPlusBtn}
                      title="Kirim (IN)"
                      onClick={() => { setTxItemId(item.id); txForm.reset({ transactionType: 'IN', unitPrice: 0 }) }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className={styles.txMinusBtn}
                      title="Chiqim (OUT)"
                      onClick={() => { setTxItemId(item.id); txForm.reset({ transactionType: 'OUT', unitPrice: 0 }) }}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="Tahrirlash"
                      onClick={() => openEdit(item)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      title="O'chirish"
                      onClick={() => setDeleteItem(item)}
                    >
                      🗑
                    </button>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      onClick={() => navigate(`/warehouse/${item.id}`)}
                    >
                      →
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Materiallar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile kartalar */}
      <div className={styles.mobileCards}>
        {!isLoading && filtered.length === 0 && (
          <div className={styles.empty} style={{ textAlign: 'center', padding: 48, color: 'var(--text3)', fontSize: 13 }}>
            Materiallar topilmadi
          </div>
        )}
        {filtered.map((item) => (
          <div
            key={item.id}
            className={cn(styles.itemCard, item.quantity < 0 ? styles.itemCardNeg : item.lowStock && styles.itemCardLow)}
            onClick={() => navigate(`/warehouse/${item.id}`)}
          >
            <div className={styles.itemCardTop}>
              <span className={styles.itemCardName}>{item.name}</span>
              {item.quantity < 0
                ? <span className={styles.negBadge}>Yetishmaydi</span>
                : item.lowStock
                  ? <span className={styles.lowBadge}>⚠ Kam</span>
                  : <span className={styles.okBadge}>OK</span>}
            </div>
            <div className={styles.itemCardMid}>
              <span className={item.quantity < 0 ? styles.negQty : item.lowStock ? styles.lowQty : styles.qty}>
                {formatNumber(item.quantity)} {UNIT_LABELS[item.unitType]}
              </span>
              {item.minQuantityAlert != null && item.minQuantityAlert > 0 && (
                <span className={styles.minHint}>min: {item.minQuantityAlert}</span>
              )}
            </div>
            <div className={styles.itemCardActions} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={styles.txPlusBtn}
                title="Kirim (IN)"
                onClick={() => { setTxItemId(item.id); txForm.reset({ transactionType: 'IN', unitPrice: 0 }) }}
              >
                +
              </button>
              <button
                type="button"
                className={styles.txMinusBtn}
                title="Chiqim (OUT)"
                onClick={() => { setTxItemId(item.id); txForm.reset({ transactionType: 'OUT', unitPrice: 0 }) }}
              >
                −
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                title="Tahrirlash"
                onClick={() => openEdit(item)}
              >
                ✎
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                title="O'chirish"
                onClick={() => setDeleteItem(item)}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit item modal */}
      <Modal
        isOpen={showItem}
        onClose={closeItem}
        title={editItem ? 'Materialni tahrirlash' : 'Yangi material'}
      >
        <form onSubmit={itemForm.handleSubmit(onItemSubmit)} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nomi *</label>
            <input
              className={styles.formInput}
              placeholder="Kashtanka mato"
              {...itemForm.register('name')}
            />
            {itemForm.formState.errors.name && (
              <span className={styles.errText}>{itemForm.formState.errors.name.message}</span>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Birlik turi *</label>
              <select className={styles.formSelect} {...itemForm.register('unitType')}>
                {UNIT_TYPES.map((u) => (
                  <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>SKU</label>
              <input
                className={styles.formInput}
                placeholder="MAT-001"
                {...itemForm.register('sku')}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Min. miqdor (ogohlantirish)</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.001"
                placeholder="10"
                {...itemForm.register('minQuantityAlert')}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Izoh</label>
              <input
                className={styles.formInput}
                placeholder="Qo'shimcha ma'lumot"
                {...itemForm.register('description')}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={closeItem}>
              Bekor qilish
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={createMut.isPending || updateMut.isPending}
            >
              {editItem ? 'Saqlash' : 'Yaratish →'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transaction modal */}
      <Modal
        isOpen={txItemId !== null}
        onClose={closeTx}
        title="Ombor tranzaksiyasi"
      >
        <form onSubmit={txForm.handleSubmit(onTxSubmit)} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tranzaksiya turi *</label>
            <select className={styles.formSelect} {...txForm.register('transactionType')}>
              {TX_TYPES.map((t) => (
                <option key={t} value={t}>{TX_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Kontekstual izoh */}
          <div className={styles.txHint}>
            {txType === 'IN'         && '📥 Kirim: zaxira ko\'payadi, o\'rtacha narx yangilanadi'}
            {txType === 'OUT'        && '📤 Chiqim: zaxira kamayadi, narx o\'rtacha qiymatda hisoblanadi'}
            {txType === 'ADJUSTMENT' && '⚙ Tuzatish: yangi mutlaq miqdorni kiriting (inventarizatsiya)'}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {txType === 'ADJUSTMENT' ? 'Yangi mutlaq miqdor *' : 'Miqdor *'}
              </label>
              <input
                className={styles.formInput}
                type="number"
                step="0.001"
                min="0"
                placeholder={txType === 'ADJUSTMENT' ? 'Masalan: 150' : 'Masalan: 50'}
                {...txForm.register('quantity')}
              />
              {txForm.formState.errors.quantity && (
                <span className={styles.errText}>{txForm.formState.errors.quantity.message}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {txType === 'IN' ? 'Birlik narxi (UZS) *' : 'Birlik narxi (UZS)'}
              </label>
              <input
                className={styles.formInput}
                type="number"
                min="0"
                placeholder={txType === 'IN' ? '25 000' : "O'rtacha narxdan foydalaniladi"}
                disabled={txType === 'OUT'}
                {...txForm.register('unitPrice')}
              />
              {txType === 'OUT' && (
                <span className={styles.fieldHint}>OUT da backend o'rtacha narxni ishlatadi</span>
              )}
            </div>
          </div>

          {/* Yetkazib beruvchi va faktura faqat IN uchun */}
          {txType === 'IN' && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Yetkazib beruvchi</label>
                <input
                  className={styles.formInput}
                  placeholder="Optima"
                  {...txForm.register('supplierName')}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hisob-faktura №</label>
                <input
                  className={styles.formInput}
                  placeholder="INV-2024-001"
                  {...txForm.register('invoiceNumber')}
                />
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Izoh</label>
            <input
              className={styles.formInput}
              placeholder="Qo'shimcha ma'lumot"
              {...txForm.register('notes')}
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={closeTx}>
              Bekor qilish
            </Button>
            <Button type="submit" size="sm" loading={txMut.isPending}>
              Saqlash →
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        title="Materialni o'chirish"
        maxWidth={420}
      >
        {deleteItem && (
          <div className={styles.deleteConfirm}>
            <p className={styles.deleteMsg}>
              <strong>"{deleteItem.name}"</strong> materialini o'chirmoqchimisiz?
            </p>
            {deleteItem.totalValue !== 0 && (
              <p className={styles.deleteWarn}>
                Umumiy qiymati <strong>{formatNumber(deleteItem.totalValue)} so'm</strong> moliyaviy jurnaldan ayirib tashlanadi.
              </p>
            )}
            <p className={styles.deleteNote}>
              Bu harakat qaytarib bo'lmaydi. Material bilan bog'liq buyurtma yozuvlari saqlanib qoladi.
            </p>
            <div className={styles.deleteActions}>
              <Button variant="ghost" size="sm" onClick={() => setDeleteItem(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteItem.id)}
              >
                O'chirish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WarehousePage
