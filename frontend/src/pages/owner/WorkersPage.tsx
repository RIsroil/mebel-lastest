import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTopbar } from '@/context/TopbarContext'
import { authApi } from '@/api/auth.api'
import { adminApi } from '@/api/admin.api'
import { workshopApi } from '@/api/workshop.api'
import type { AdminUserResponse } from '@/types/admin.types'
import type { PayType } from '@/types/auth.types'
import { formatNumber } from '@/utils/formatMoney'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import styles from './WorkersPage.module.css'

const PAY_LABELS: Record<PayType, string> = {
  DAILY:   'Kunlik',
  MONTHLY: 'Oylik',
}

const schema = z.object({
  workshopId:       z.string().min(1, 'Seh tanlash shart'),
  username:         z.string().min(3, 'Kamida 3 ta belgi'),
  password:         z.string().min(4, 'Kamida 4 ta belgi'),
  payType:          z.enum(['DAILY','MONTHLY']),
  dailyHoursTarget: z.coerce.number().min(1).max(24),
  dailySalary:      z.coerce.number().min(0),
})
type FormData = z.infer<typeof schema>

const WorkersPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()

  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUserResponse | null>(null)

  const { data: workersResp, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn:  () => adminApi.users.getAll({ role: 'WORKER', size: 200 }),
  })

  const { data: workshopsResp } = useQuery({
    queryKey: ['workshops'],
    queryFn:  () => workshopApi.getAll({ size: 100 }),
  })

  const createMut = useMutation({
    mutationFn: authApi.createWorker,
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      handleClose()
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => authApi.deleteWorker(id),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      setDeleteTarget(null)
    },
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver:      zodResolver(schema) as Resolver<FormData>,
    defaultValues: { payType: 'DAILY', dailyHoursTarget: 8, dailySalary: 0 },
  })

  useEffect(() => {
    setTitle('Ishchilar')
    setActions(<Button size="sm" onClick={() => setShowCreate(true)}>+ Yangi ishchi</Button>)
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const handleClose = () => { setShowCreate(false); reset() }

  const onSubmit = (data: FormData) => {
    createMut.mutate({
      workshopId:       data.workshopId,
      username:         data.username,
      password:         data.password,
      payType:          data.payType,
      dailyHoursTarget: data.dailyHoursTarget,
      dailySalary:      data.dailySalary,
    })
  }

  const workers   = workersResp?.data?.data?.content ?? []
  const workshops = workshopsResp?.data?.data?.content ?? []

  const filtered = workers.filter((w) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (w.fullName ?? '').toLowerCase().includes(q) ||
      w.username.toLowerCase().includes(q) ||
      (w.workshopName ?? '').toLowerCase().includes(q)
    )
  })

  const activeCount  = workers.filter((w) => w.active && !w.blocked).length
  const blockedCount = workers.filter((w) => w.blocked).length

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="🔍 Ism yoki username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.hint}>
          Jami: <strong>{workers.length}</strong> ta
          {blockedCount > 0 && (
            <span className={styles.blockedAlert}> · {blockedCount} ta bloklangan</span>
          )}
          {' '}· <span className={styles.activeCount}>{activeCount} ta aktiv</span>
        </span>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ishchi</th>
              <th>Username</th>
              <th>Seh</th>
              <th>To'lov turi</th>
              <th>Kunlik soat</th>
              <th>Kunlik maosh</th>
              <th>Holat</th>
              <th>Amal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((worker) => (
              <tr key={worker.id}>
                <td>
                  <div className={styles.workerCell}>
                    <Avatar name={worker.fullName || worker.username} role="WORKER" size="sm" />
                    <span className={styles.workerName}>
                      {worker.fullName || worker.username}
                    </span>
                  </div>
                </td>
                <td className={styles.username}>{worker.username}</td>
                <td>{worker.workshopName ?? '—'}</td>
                <td>
                  {worker.payType
                    ? <span className={cn(styles.payBadge, worker.payType === 'DAILY' ? styles.payDaily : styles.payMonthly)}>
                        {PAY_LABELS[worker.payType]}
                      </span>
                    : '—'}
                </td>
                <td>{worker.dailyHoursTarget != null ? `${worker.dailyHoursTarget} soat` : '—'}</td>
                <td className={styles.salary}>
                  {worker.dailySalary != null ? formatNumber(worker.dailySalary) : '—'}
                </td>
                <td>
                  {worker.blocked
                    ? <span className={styles.blockedBadge}>Bloklangan</span>
                    : worker.active
                      ? <span className={styles.activeBadge}>Aktiv</span>
                      : <span className={styles.inactiveBadge}>Nofaol</span>}
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => setDeleteTarget(worker)}
                  >
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Ishchilar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create worker modal */}
      <Modal isOpen={showCreate} onClose={handleClose} title="Yangi ishchi qo'shish">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Seh *</label>
            <select className={styles.formSelect} {...register('workshopId')}>
              <option value="">— Seh tanlang —</option>
              {workshops.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
            {errors.workshopId && <span className={styles.errText}>{errors.workshopId.message}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Username *</label>
              <input
                className={styles.formInput}
                placeholder="ali_xasanov"
                {...register('username')}
              />
              {errors.username && <span className={styles.errText}>{errors.username.message}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Parol *</label>
              <input
                className={styles.formInput}
                type="password"
                placeholder="••••••"
                {...register('password')}
              />
              {errors.password && <span className={styles.errText}>{errors.password.message}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>To'lov turi *</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" value="DAILY" {...register('payType')} />
                Kunlik
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" value="MONTHLY" {...register('payType')} />
                Oylik
              </label>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Kunlik soat maqsadi *</label>
              <input
                className={styles.formInput}
                type="number"
                min={1}
                max={24}
                placeholder="8"
                {...register('dailyHoursTarget')}
              />
              {errors.dailyHoursTarget && (
                <span className={styles.errText}>{errors.dailyHoursTarget.message}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Kunlik maosh (UZS)</label>
              <input
                className={styles.formInput}
                type="number"
                placeholder="50000"
                {...register('dailySalary')}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Bekor qilish
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={isSubmitting || createMut.isPending}
            >
              Qo'shish →
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Ishchini o'chirish"
      >
        {deleteTarget && (
          <div>
            <p className={styles.confirmText}>
              <strong>{deleteTarget.fullName || deleteTarget.username}</strong> ni o'chirishni
              tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Bekor qilish
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteTarget.id)}
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

export default WorkersPage
