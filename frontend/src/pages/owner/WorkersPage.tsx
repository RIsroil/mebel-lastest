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
import { attendanceApi } from '@/api/attendance.api'
import type { AdminUserResponse } from '@/types/admin.types'
import type { PayType } from '@/types/auth.types'
import type { WeeklyDayResponse } from '@/types/attendance.types'
import { formatNumber } from '@/utils/formatMoney'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import styles from './WorkersPage.module.css'

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() || 7
  if (day !== 1) d.setDate(d.getDate() - (day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

// UTC emas, lokal vaqt asosida YYYY-MM-DD
function toLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function weekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${fmt(monday)} – ${fmt(sunday)}`
}

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

const updateSchema = z.object({
  fullName:         z.string().optional(),
  phone:            z.string().optional(),
  payType:          z.enum(['DAILY','MONTHLY']),
  dailyHoursTarget: z.coerce.number().min(1).max(24),
  dailySalary:      z.coerce.number().min(0),
  commissionPct:    z.coerce.number().min(0).max(100).optional(),
})
type UpdateFormData = z.infer<typeof updateSchema>

const WorkersPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()

  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget]     = useState<AdminUserResponse | null>(null)
  const [editTarget, setEditTarget]         = useState<AdminUserResponse | null>(null)
  const [attendanceWorker, setAttendanceWorker] = useState<AdminUserResponse | null>(null)
  const [attendanceMonday, setAttendanceMonday] = useState(() => getMondayOf(new Date()))

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

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFormData }) =>
      adminApi.users.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      setEditTarget(null)
      editForm.reset()
    },
  })

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema) as Resolver<UpdateFormData>,
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

  const attendanceMondayStr = toLocalDate(attendanceMonday)
  const { data: weeklyResp, isLoading: weeklyLoading } = useQuery({
    queryKey: ['worker-weekly', attendanceWorker?.id, attendanceMondayStr],
    queryFn: () => attendanceApi.getWorkerWeekly(attendanceWorker!.id, attendanceMondayStr),
    enabled: !!attendanceWorker,
  })
  const weeklyDays: WeeklyDayResponse[] = weeklyResp?.data?.data ?? []

  const openAttendance = (worker: AdminUserResponse) => {
    setAttendanceWorker(worker)
    setAttendanceMonday(getMondayOf(new Date()))
  }

  const openEdit = (worker: AdminUserResponse) => {
    editForm.reset({
      fullName:         worker.fullName ?? '',
      phone:            worker.phone ?? '',
      payType:          worker.payType ?? 'DAILY',
      dailyHoursTarget: worker.dailyHoursTarget ?? 8,
      dailySalary:      worker.dailySalary ?? 0,
      commissionPct:    worker.commissionPct ?? 0,
    })
    setEditTarget(worker)
  }

  const onEditSubmit = (data: UpdateFormData) => {
    if (!editTarget) return
    updateMut.mutate({ id: editTarget.id, body: data })
  }

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
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className={styles.attendanceBtn}
                      onClick={() => openAttendance(worker)}
                    >
                      Davomat
                    </button>
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => openEdit(worker)}
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => setDeleteTarget(worker)}
                    >
                      O'chirish
                    </button>
                  </div>
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

      {/* Edit worker modal */}
      <Modal
        isOpen={editTarget !== null}
        onClose={() => { setEditTarget(null); editForm.reset() }}
        title="Ishchini tahrirlash"
      >
        {editTarget && (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} noValidate>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
              <Avatar name={editTarget.fullName || editTarget.username} role="WORKER" size="sm" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{editTarget.fullName || editTarget.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>@{editTarget.username}</div>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>To'liq ism</label>
                <input className={styles.formInput} placeholder="Ali Xasanov" {...editForm.register('fullName')} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Telefon</label>
                <input className={styles.formInput} placeholder="+998901234567" {...editForm.register('phone')} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>To'lov turi *</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" value="DAILY" {...editForm.register('payType')} /> Kunlik
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" value="MONTHLY" {...editForm.register('payType')} /> Oylik
                </label>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Kunlik soat maqsadi *</label>
                <input className={styles.formInput} type="number" min={1} max={24} {...editForm.register('dailyHoursTarget')} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Kunlik maosh (UZS)</label>
                <input className={styles.formInput} type="number" min={0} {...editForm.register('dailySalary')} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Komissiya foizi (%)</label>
              <input className={styles.formInput} type="number" min={0} max={100} step="0.01" placeholder="0" {...editForm.register('commissionPct')} />
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setEditTarget(null); editForm.reset() }}>
                Bekor qilish
              </Button>
              <Button type="submit" size="sm" loading={updateMut.isPending}>
                Saqlash →
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Worker weekly attendance modal */}
      <Modal
        isOpen={!!attendanceWorker}
        onClose={() => setAttendanceWorker(null)}
        title={attendanceWorker ? `${attendanceWorker.fullName || attendanceWorker.username} — Haftalik davomat` : ''}
        maxWidth={740}
      >
        {attendanceWorker && (
          <div>
            {/* Hafta navigatsiyasi */}
            <div className={styles.weekNav}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => {
                  const d = new Date(attendanceMonday)
                  d.setDate(d.getDate() - 7)
                  setAttendanceMonday(d)
                }}
              >
                ← Oldingi
              </button>
              <span className={styles.weekNavLabel}>{weekLabel(attendanceMonday)}</span>
              <button
                type="button"
                className={styles.navBtn}
                disabled={toLocalDate(getMondayOf(new Date())) === attendanceMondayStr}
                onClick={() => {
                  const d = new Date(attendanceMonday)
                  d.setDate(d.getDate() + 7)
                  if (toLocalDate(d) <= toLocalDate(getMondayOf(new Date()))) {
                    setAttendanceMonday(d)
                  }
                }}
              >
                Keyingi →
              </button>
            </div>

            {weeklyLoading ? (
              <div className={styles.loadingCell}>Yuklanmoqda...</div>
            ) : (
              <table className={styles.weeklyTable}>
                <thead>
                  <tr>
                    <th>Kun</th>
                    <th>Kelish → Ketish</th>
                    <th>Ishlagan / Norma</th>
                    <th>Hisoblangan / Kunlik</th>
                    <th>Qo'shimcha</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyDays.map((day) => {
                    const hasData    = day.hoursWorked != null
                    const normaOk    = hasData && day.hoursWorked! >= (day.hoursTarget ?? 8)
                    const hasBonus   = day.bonusHours != null && day.bonusHours > 0

                    return (
                      <tr
                        key={day.date}
                        className={
                          !hasData
                            ? styles.emptyRow
                            : day.hoursLocked
                            ? styles.lockedRow
                            : undefined
                        }
                      >
                        {/* Kun */}
                        <td>
                          <div className={styles.weekDayLabel}>{day.dayLabel}</div>
                          <div className={styles.weekDayDate}>
                            {day.date.slice(5).replace('-', '/')}
                          </div>
                        </td>

                        {/* Kelish → Ketish */}
                        <td className={styles.monoCell}>
                          {hasData ? (
                            <span>
                              {day.checkInTime  ? day.checkInTime.slice(0, 5)  : '--:--'}
                              <span className={styles.arrow}> → </span>
                              {day.checkOutTime ? day.checkOutTime.slice(0, 5) : '--:--'}
                            </span>
                          ) : (
                            <span className={styles.dash}>Kelmagan</span>
                          )}
                        </td>

                        {/* Ishlagan / Norma */}
                        <td>
                          {hasData ? (
                            <>
                              <span className={normaOk ? styles.hoursOk : styles.hoursShort}>
                                {day.hoursWorked}h
                              </span>
                              <span className={styles.target}> / {day.hoursTarget ?? 8}h</span>
                            </>
                          ) : (
                            <>
                              <span className={styles.dash}>—</span>
                              <span className={styles.target}> / {day.hoursTarget ?? 8}h</span>
                            </>
                          )}
                        </td>

                        {/* Hisoblangan / Kunlik */}
                        <td>
                          {day.dailyPayAmount != null ? (
                            <>
                              <span className={styles.payAmount}>{formatNumber(day.dailyPayAmount)}</span>
                              {day.dailySalary != null && (
                                <span className={styles.target}> / {formatNumber(day.dailySalary)}</span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className={styles.dash}>—</span>
                              {day.dailySalary != null && (
                                <span className={styles.target}> / {formatNumber(day.dailySalary)}</span>
                              )}
                            </>
                          )}
                        </td>

                        {/* Bonus */}
                        <td>
                          {hasBonus ? (
                            <span className={styles.bonusBadge}>+{day.bonusHours}h qo'shimcha</span>
                          ) : (
                            <span className={styles.dash}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
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
