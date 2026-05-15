import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
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
import type { WeeklyDayResponse, ManualEntryRequest } from '@/types/attendance.types'
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

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const MONTH_NAMES = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
const DAY_SHORT = ['Du','Se','Ch','Pa','Ju','Sh','Ya']

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
  const [attendanceYear, setAttendanceYear]     = useState(() => new Date().getFullYear())
  const [attendanceMonth, setAttendanceMonth]   = useState(() => new Date().getMonth())

  // Day edit modal state
  const [editDayInfo, setEditDayInfo] = useState<{
    dateStr: string; workerId: string; dayData: WeeklyDayResponse | null
  } | null>(null)
  const [editCheckIn,  setEditCheckIn]  = useState('09:00')
  const [editCheckOut, setEditCheckOut] = useState('17:00')
  const [editNotes,    setEditNotes]    = useState('')
  const [editHours,    setEditHours]    = useState('')

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

  const ownerEntryMut = useMutation({
    mutationFn: ({ workerId, body }: { workerId: string; body: ManualEntryRequest }) =>
      attendanceApi.ownerUpsertWorkerEntry(workerId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-weekly'] })
      setEditDayInfo(null)
    },
  })

  const overrideHoursMut = useMutation({
    mutationFn: ({ attendanceId, hoursWorked, notes }: { attendanceId: string; hoursWorked: number; notes?: string }) =>
      attendanceApi.overrideHours(attendanceId, { hoursWorked, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-weekly'] })
      setEditDayInfo(null)
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

  const calendarMondays = useMemo((): string[] => {
    const firstDay = new Date(attendanceYear, attendanceMonth, 1)
    const lastDay  = new Date(attendanceYear, attendanceMonth + 1, 0)
    const start = getMondayOf(firstDay)
    const end   = getMondayOf(lastDay)
    const mondays: string[] = []
    let cur = start
    while (cur <= end) {
      mondays.push(toLocalDate(cur))
      cur = addDays(cur, 7)
    }
    return mondays
  }, [attendanceYear, attendanceMonth])

  const weekQueries = useQueries({
    queries: calendarMondays.map((monday) => ({
      queryKey: ['worker-weekly', attendanceWorker?.id, monday],
      queryFn: () => attendanceApi.getWorkerWeekly(attendanceWorker!.id, monday),
      enabled: !!attendanceWorker,
      retry: 1,
      staleTime: 30_000,
    })),
  })

  const dayMap = useMemo((): Record<string, WeeklyDayResponse> => {
    const map: Record<string, WeeklyDayResponse> = {}
    for (const q of weekQueries) {
      const days: WeeklyDayResponse[] = q.data?.data?.data ?? []
      for (const d of days) map[d.date] = d
    }
    return map
  }, [weekQueries])

  const weeklyLoading = weekQueries.some((q) => q.isLoading)
  const weeklyError   = !weeklyLoading && weekQueries.every((q) => q.isError)

  const calendarDates = useMemo((): Date[] => {
    return calendarMondays.flatMap((mondayStr) => {
      const monday = new Date(mondayStr)
      return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
    })
  }, [calendarMondays])

  const isAttendanceCurrentMonth = attendanceYear === new Date().getFullYear() && attendanceMonth === new Date().getMonth()
  const todayStr = toLocalDate(new Date())

  const openAttendance = (worker: AdminUserResponse) => {
    setAttendanceWorker(worker)
    setAttendanceYear(new Date().getFullYear())
    setAttendanceMonth(new Date().getMonth())
  }

  const openDayEdit = (dateStr: string, workerId: string, dayData: WeeklyDayResponse | null) => {
    setEditDayInfo({ dateStr, workerId, dayData })
    setEditCheckIn(dayData?.checkInTime?.slice(0, 5) ?? '09:00')
    setEditCheckOut(dayData?.checkOutTime?.slice(0, 5) ?? '17:00')
    setEditNotes(dayData?.notes ?? '')
    setEditHours(dayData?.hoursWorked != null ? String(dayData.hoursWorked) : '')
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

      {/* Desktop jadval */}
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
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      type="button"
                      className={styles.calBtn}
                      title="Davomat"
                      onClick={() => openAttendance(worker)}
                    >
                      📅
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="Tahrirlash"
                      onClick={() => openEdit(worker)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={styles.trashBtn}
                      title="O'chirish"
                      onClick={() => setDeleteTarget(worker)}
                    >
                      🗑
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

      {/* Mobile kartalar */}
      <div className={styles.mobileCards}>
        {!isLoading && filtered.length === 0 && (
          <div className={styles.empty} style={{ textAlign: 'center', padding: 48, color: 'var(--text3)', fontSize: 13 }}>
            Ishchilar topilmadi
          </div>
        )}
        {filtered.map((worker) => (
          <div key={worker.id} className={styles.workerCard}>
            <div className={styles.workerCardTop}>
              <div className={styles.workerCardLeft}>
                <Avatar name={worker.fullName || worker.username} role="WORKER" size="sm" />
                <div className={styles.workerCardInfo}>
                  <span className={styles.workerCardName}>{worker.fullName || worker.username}</span>
                  <span className={styles.workerCardSub}>{worker.workshopName ?? worker.username}</span>
                </div>
              </div>
              <div>
                {worker.blocked
                  ? <span className={styles.blockedBadge}>Bloklangan</span>
                  : worker.active
                    ? <span className={styles.activeBadge}>Aktiv</span>
                    : <span className={styles.inactiveBadge}>Nofaol</span>}
              </div>
            </div>
            <div className={styles.workerCardMid}>
              <span className={styles.workerCardSalary}>
                {worker.dailySalary != null ? formatNumber(worker.dailySalary) : '—'} so'm/kun
              </span>
              {worker.payType && (
                <span className={cn(styles.payBadge, worker.payType === 'DAILY' ? styles.payDaily : styles.payMonthly)}>
                  {PAY_LABELS[worker.payType]}
                </span>
              )}
            </div>
            <div className={styles.workerCardActions}>
              <button
                type="button"
                className={styles.calBtn}
                title="Davomat"
                onClick={() => openAttendance(worker)}
              >
                📅
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                title="Tahrirlash"
                onClick={() => openEdit(worker)}
              >
                ✎
              </button>
              <button
                type="button"
                className={styles.trashBtn}
                title="O'chirish"
                onClick={() => setDeleteTarget(worker)}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
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

      {/* Worker attendance modal — monthly calendar */}
      <Modal
        isOpen={!!attendanceWorker}
        onClose={() => setAttendanceWorker(null)}
        title={attendanceWorker ? `${attendanceWorker.fullName || attendanceWorker.username} — ${MONTH_NAMES[attendanceMonth]} ${attendanceYear}` : ''}
        maxWidth={600}
      >
        {attendanceWorker && (
          <div>
            {/* Oy navigatsiyasi */}
            <div className={styles.weekNav}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => {
                  if (attendanceMonth === 0) { setAttendanceYear((y) => y - 1); setAttendanceMonth(11) }
                  else setAttendanceMonth((m) => m - 1)
                }}
              >← Oldingi</button>
              <span className={styles.weekNavLabel}>{MONTH_NAMES[attendanceMonth]} {attendanceYear}</span>
              <button
                type="button"
                className={styles.navBtn}
                disabled={isAttendanceCurrentMonth}
                onClick={() => {
                  if (isAttendanceCurrentMonth) return
                  if (attendanceMonth === 11) { setAttendanceYear((y) => y + 1); setAttendanceMonth(0) }
                  else setAttendanceMonth((m) => m + 1)
                }}
              >Keyingi →</button>
            </div>

            {/* Calendar grid */}
            <div className={styles.workerCal}>
              <div className={styles.workerCalHeader}>
                {DAY_SHORT.map((d) => (
                  <div key={d} className={styles.workerCalDayHead}>{d}</div>
                ))}
              </div>

              {weeklyLoading ? (
                <div className={styles.loadingCell}>Yuklanmoqda...</div>
              ) : weeklyError ? (
                <div className={styles.loadingCell} style={{ color: 'var(--red)' }}>Ma'lumot yuklanmadi</div>
              ) : (
                <div className={styles.workerCalBody}>
                  {calendarDates.map((date) => {
                    const dateStr = toLocalDate(date)
                    const isThisMonth = date.getMonth() === attendanceMonth
                    const dayData = dayMap[dateStr]
                    const isToday = dateStr === todayStr
                    const hasWorked = !!dayData?.checkInTime
                    const normaOk = hasWorked && (dayData?.hoursWorked ?? 0) >= (dayData?.hoursTarget ?? 8)
                    const isPastOrToday = dateStr <= todayStr
                    const isDayPaid = !!dayData?.paid
                    const canEdit = isThisMonth && isPastOrToday && !!attendanceWorker && !isDayPaid

                    return (
                      <div
                        key={dateStr}
                        className={[
                          styles.workerCalDay,
                          !isThisMonth ? styles.calOtherMonth : '',
                          isToday ? styles.calToday : '',
                          isThisMonth && hasWorked ? styles.calWorked : '',
                          isThisMonth && !hasWorked && dayData ? styles.calAbsent : '',
                          dayData?.hoursLocked ? styles.calLocked : '',
                        ].filter(Boolean).join(' ')}
                      >
                        <span className={styles.calDateNum}>{date.getDate()}</span>
                        {isThisMonth && (
                          <div className={styles.calDayInfo}>
                            {hasWorked ? (
                              <>
                                <div className={styles.calHoursRow}>
                                  {dayData.hoursWorked != null && (
                                    <span className={normaOk ? styles.calHoursOk : styles.calHoursShort}>
                                      {dayData.hoursWorked}h
                                    </span>
                                  )}
                                  {canEdit && (
                                    <button
                                      type="button"
                                      className={styles.calEditBtn}
                                      title="Soatlarni tahrirlash"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openDayEdit(dateStr, attendanceWorker!.id, dayData)
                                      }}
                                    >✎</button>
                                  )}
                                </div>
                                {dayData.checkInTime && dayData.checkOutTime && (
                                  <span className={styles.calTimeRange}>
                                    {dayData.checkInTime.slice(0,5)}–{dayData.checkOutTime.slice(0,5)}
                                  </span>
                                )}
                              {dayData.paid && (
                                <span className={styles.calPaidBadge}>✓</span>
                              )}
                              </>
                            ) : (
                              <div className={styles.calHoursRow}>
                                <span className={styles.calAbsentMark}>✕</span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    className={styles.calEditBtn}
                                    title="Davomat kiritish"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openDayEdit(dateStr, attendanceWorker!.id, dayData ?? null)
                                    }}
                                  >✎</button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Oy xulosasi */}
            {!weeklyLoading && (() => {
              const monthDays = Object.values(dayMap).filter((d) => {
                const [y, m] = d.date.split('-').map(Number)
                return y === attendanceYear && m === attendanceMonth + 1
              })
              const worked = monthDays.filter((d) => d.checkInTime).length
              const totalHours = monthDays.reduce((s, d) => s + (d.hoursWorked ?? 0), 0)
              const totalPay   = monthDays.reduce((s, d) => s + (d.dailyPayAmount ?? 0), 0)
              if (monthDays.length === 0) return null
              return (
                <div className={styles.workerCalSummary}>
                  <div className={styles.calSummItem}>
                    <span className={styles.calSummVal}>{worked}</span>
                    <span className={styles.calSummKey}>Kelgan kun</span>
                  </div>
                  <div className={styles.calSummItem}>
                    <span className={styles.calSummVal}>{Math.round(totalHours * 10) / 10}h</span>
                    <span className={styles.calSummKey}>Ishlagan soat</span>
                  </div>
                  <div className={styles.calSummItem}>
                    <span className={styles.calSummVal}>{formatNumber(totalPay)}</span>
                    <span className={styles.calSummKey}>Hisoblangan maosh</span>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </Modal>

      {/* Day edit modal */}
      <Modal
        isOpen={!!editDayInfo}
        onClose={() => setEditDayInfo(null)}
        title={editDayInfo
          ? editDayInfo.dayData?.checkInTime
            ? `${editDayInfo.dateStr} — soatlarni tahrirlash`
            : `${editDayInfo.dateStr} — davomat kiritish`
          : ''}
        maxWidth={380}
      >
        {editDayInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {editDayInfo.dayData?.checkInTime ? (
              /* Ishchi mavjud, faqat soat tahrirlanadi */
              <>
                <div style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Ishchi vaqti</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {editDayInfo.dayData.checkInTime.slice(0, 5)}
                    {editDayInfo.dayData.checkOutTime ? ` – ${editDayInfo.dayData.checkOutTime.slice(0, 5)}` : ''}
                  </span>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Ishlangan soat *
                    <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>
                      (avvalgi: {editDayInfo.dayData.hoursWorked ?? '—'}h)
                    </span>
                  </label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    placeholder="8"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Izoh</label>
                  <input
                    className={styles.formInput}
                    placeholder="Ixtiyoriy..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditDayInfo(null)}>
                    Bekor qilish
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    loading={overrideHoursMut.isPending}
                    disabled={!editHours || parseFloat(editHours) <= 0 || !editDayInfo.dayData.attendanceId}
                    onClick={() => {
                      if (!editDayInfo.dayData?.attendanceId) return
                      overrideHoursMut.mutate({
                        attendanceId: editDayInfo.dayData.attendanceId,
                        hoursWorked: parseFloat(editHours),
                        notes: editNotes || undefined,
                      })
                    }}
                  >
                    Saqlash →
                  </Button>
                </div>
              </>
            ) : (
              /* Ishchi yo'q edi — qo'lda davomat kiritish */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kirish vaqti *</label>
                    <input
                      className={styles.formInput}
                      type="time"
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Chiqish vaqti *</label>
                    <input
                      className={styles.formInput}
                      type="time"
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Izoh</label>
                  <input
                    className={styles.formInput}
                    placeholder="Ixtiyoriy..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditDayInfo(null)}>
                    Bekor qilish
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    loading={ownerEntryMut.isPending}
                    disabled={!editCheckIn || !editCheckOut || editCheckOut <= editCheckIn}
                    onClick={() => {
                      ownerEntryMut.mutate({
                        workerId: editDayInfo.workerId,
                        body: {
                          date: editDayInfo.dateStr,
                          checkInTime: editCheckIn,
                          checkOutTime: editCheckOut,
                          notes: editNotes || undefined,
                        },
                      })
                    }}
                  >
                    Saqlash →
                  </Button>
                </div>
              </>
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
