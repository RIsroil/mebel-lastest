import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTopbar } from '@/context/TopbarContext'
import { furnitureApi } from '@/api/furniture.api'
import type { FurnitureStatus } from '@/types/furniture.types'
import { formatNumber } from '@/utils/formatMoney'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import styles from './OrdersPage.module.css'

const STATUS_TABS: Array<{ value: FurnitureStatus | 'ALL'; label: string }> = [
  { value: 'ALL',         label: 'Barchasi' },
  { value: 'DRAFT',       label: 'Draft' },
  { value: 'IN_PROGRESS', label: 'Jarayonda' },
  { value: 'COMPLETED',   label: 'Tayyor' },
  { value: 'SOLD',        label: 'Sotilgan' },
  { value: 'CANCELLED',   label: 'Bekor' },
]

const schema = z.object({
  title:         z.string().min(2, 'Kamida 2 ta belgi'),
  salePrice:     z.coerce.number().min(1, 'Narx kiritish shart'),
  estimatedCost: z.coerce.number().min(0),
  clientName:    z.string().optional(),
  clientPhone:   z.string().optional(),
  description:   z.string().optional(),
})

type FormData = z.infer<typeof schema>

const OrdersPage = () => {
  const { setTitle, setActions } = useTopbar()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab]   = useState<FurnitureStatus | 'ALL'>('ALL')
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: ordersResp, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: furnitureApi.orders.getAll,
  })

  const createMutation = useMutation({
    mutationFn: furnitureApi.orders.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowCreate(false)
      navigate(`/orders/${res.data.data.id}`)
    },
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { estimatedCost: 0 },
  })

  useEffect(() => {
    setTitle('Buyurtmalar')
    setActions(
      <Button size="sm" onClick={() => setShowCreate(true)}>+ Yangi buyurtma</Button>
    )
    return () => {
      setTitle('')
      setActions(null)
    }
  }, [setTitle, setActions])

  const orders   = ordersResp?.data?.data ?? []
  const filtered = orders.filter((o) => {
    if (activeTab !== 'ALL' && o.status !== activeTab) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        o.title.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.clientName ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      title:         data.title,
      salePrice:     data.salePrice,
      estimatedCost: data.estimatedCost,
      clientName:    data.clientName,
      clientPhone:   data.clientPhone,
      description:   data.description,
    })
  }

  const handleClose = () => {
    setShowCreate(false)
    reset()
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="🔍 Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.tabs}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={cn(styles.tab, activeTab === tab.value && styles.tabActive)}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Raqam</th>
              <th>Mebel</th>
              <th>Mijoz</th>
              <th>Status</th>
              <th>Narx</th>
              <th>Material xarajat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
                <td className={styles.orderNum}>{order.orderNumber}</td>
                <td>{order.title}</td>
                <td>{order.clientName ?? '—'}</td>
                <td><Badge variant={order.status} /></td>
                <td className={styles.price}>{formatNumber(order.salePrice)}</td>
                <td>{formatNumber(order.actualMaterialCost)}</td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>Buyurtmalar topilmadi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreate} onClose={handleClose} title="Yangi buyurtma">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mebel nomi *</label>
            <input
              className={styles.formInput}
              placeholder="Uch o'rinli divan"
              {...register('title')}
            />
            {errors.title && (
              <span style={{ fontSize: 11, color: 'var(--red)' }}>{errors.title.message}</span>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sotish narxi (UZS) *</label>
              <input
                className={styles.formInput}
                type="number"
                placeholder="3500000"
                {...register('salePrice')}
              />
              {errors.salePrice && (
                <span style={{ fontSize: 11, color: 'var(--red)' }}>{errors.salePrice.message}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Taxminiy xarajat</label>
              <input
                className={styles.formInput}
                type="number"
                placeholder="1200000"
                {...register('estimatedCost')}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mijoz ismi</label>
              <input
                className={styles.formInput}
                placeholder="Alisher Umarov"
                {...register('clientName')}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mijoz telefon</label>
              <input
                className={styles.formInput}
                placeholder="+998901112233"
                {...register('clientPhone')}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Izoh</label>
            <input
              className={styles.formInput}
              placeholder="Qo'shimcha ma'lumot..."
              {...register('description')}
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Bekor qilish
            </Button>
            <Button type="submit" size="sm" loading={isSubmitting || createMutation.isPending}>
              Yaratish →
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default OrdersPage
