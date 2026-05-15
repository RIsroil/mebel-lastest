import { useEffect, useState, useMemo } from 'react'
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTopbar } from '@/context/TopbarContext'
import { attendanceApi } from '@/api/attendance.api'
import { useAuthStore } from '@/store/auth.store'
import { formatNumber } from '@/utils/formatMoney'
import type { WeeklyDayResponse } from '@/types/attendance.types'
import Modal from '@/components/ui/Modal'
import styles from './WeeklyAttendancePage.module.css'

/* ── helpers ──────────────────────────────────────────────────── */
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() || 7
  if (day !== 1) d.setDate(d.getDate() - (day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

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

const MONTH_NAMES = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
]
const DAY_SHORT = ['Du','Se','Ch','Pa','Ju','Sh','Ya']

function parseTime(t: string | null): string {
  if (!t) return ''
  return t.slice(0, 5)
}

function calcHours(checkIn: string, checkOut: string): number | null {
  if (!checkIn || !checkOut) return null
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = checkOut.split(':').map(Number)
  const mins = (oh * 60 + om) - (ih * 60 + im)
  return mins > 0 ? Math.round(mins * 100 / 60) / 100 : null
}

/* ── component ────────────────────────────────────────────────── */
const WeeklyAttendancePage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.workshopAttendanceMode === 'BUTTON_MODE') {
      navigate('/check-in', { replace: true })
    }
  }, [user?.workshopAttendanceMode, navigate])

  const [year, setYear]   = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())

  const [editDay, setEditDay]   = useState<WeeklyDayResponse | null>(null)
  const [editIn, setEditIn]     = useState('')
  const [editOut, setEditOut]   = useState('')

  useEffect(() => {
    setTitle('Davomat')
    setActions(null)
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const calendarMondays = useMemo((): string[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay  = new Date(year, month + 1, 0)
    const start = getMondayOf(firstDay)
    const end   = getMondayOf(lastDay)
    const mondays: string[] = []
    let cur = start
    while (cur <= end) {
      mondays.push(toLocalDate(cur))
      cur = addDays(cur, 7)
    }
    return mondays
  }, [year, month])

  const weekQueries = useQueries({
    queries: calendarMondays.map((monday) => ({
      queryKey: ['weekly-attendance', monday],
      queryFn: () => attendanceApi.getMyWeekly(monday),
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

  const isLoading = weekQueries.some((q) => q.isLoading)

  const saveMut = useMutation({
    mutationFn: attendanceApi.upsertManualEntry,
    onSuccess: (_, vars) => {
      const d = new Date(vars.date)
      queryClient.invalidateQueries({ queryKey: ['weekly-attendance', toLocalDate(getMondayOf(d))] })
      setEditDay(null)
    },
  })

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const today = toLocalDate(new Date())
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth()

  const openEdit = (day: WeeklyDayResponse) => {
    if (!day.editable || day.hoursLocked) return
    setEditDay(day)
    setEditIn(parseTime(day.checkInTime))
    setEditOut(parseTime(day.checkOutTime))
  }

  const handleSave = () => {
    if (!editDay || !editIn || !editOut) return
    saveMut.mutate({ date: editDay.date, checkInTime: editIn, checkOutTime: editOut })
  }

  const editValid = editIn.length === 5 && editOut.length === 5 &&
    (calcHours(editIn, editOut) ?? 0) > 0

  const calendarDates: Date[] = useMemo(() => {
    return calendarMondays.flatMap((mondayStr) => {
      const monday = new Date(mondayStr)
      return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
    })
  }, [calendarMondays])

  return (
    <div className={styles.page}>
      {/* Month navigation */}
      <div className={styles.monthNav}>
        <button type="button" className={styles.navBtn} onClick={prevMonth}>← Oldingi</button>
        <span className={styles.monthLabel}>{MONTH_NAMES[month]} {year}</span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={nextMonth}
          disabled={isCurrentMonth}
        >
          Keyingi →
        </button>
      </div>

      {/* Calendar grid */}
      <div className={styles.calCard}>
        <div className={styles.calHeader}>
          {DAY_SHORT.map((d) => (
            <div key={d} className={styles.dayHeader}>{d}</div>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : (
          <div className={styles.calBody}>
            {calendarDates.map((date) => {
              const dateStr = toLocalDate(date)
              const isThisMonth = date.getMonth() === month
              const dayData = dayMap[dateStr]
              const isToday = dateStr === today
              const isLocked = dayData?.hoursLocked
              const isEditable = dayData?.editable && !dayData?.hoursLocked
              const isFuture = dayData ? !dayData.editable : isThisMonth && dateStr > today

              return (
                <div
                  key={dateStr}
                  className={[
                    styles.dayCell,
                    !isThisMonth ? styles.otherMonth : '',
                    isToday ? styles.todayCell : '',
                    dayData?.checkInTime ? styles.workedCell : '',
                    isFuture ? styles.futureCell : '',
                    isLocked ? styles.lockedCell : '',
                    isEditable ? styles.editableCell : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => dayData && openEdit(dayData)}
                  title={isEditable ? 'Vaqtni tahrirlash uchun bosing' : undefined}
                >
                  <span className={styles.dateNum}>{date.getDate()}</span>

                  {isThisMonth && dayData && (
                    <div className={styles.dayInfo}>
                      {dayData.checkInTime ? (
                        <>
                          <span className={styles.timeSmall}>
                            {dayData.checkInTime.slice(0, 5)}
                          </span>
                          {dayData.hoursWorked != null && (
                            <span className={[
                              styles.hoursBadge,
                              dayData.hoursWorked >= (dayData.hoursTarget ?? 8)
                                ? styles.hoursOk : styles.hoursShort,
                            ].join(' ')}>
                              {dayData.hoursWorked}h
                            </span>
                          )}
                        </>
                      ) : !isFuture ? (
                        <span className={styles.absent}>Kelmagan</span>
                      ) : null}
                      {isLocked && <span className={styles.lockedIcon}>🔒</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Month summary */}
      {!isLoading && Object.keys(dayMap).length > 0 && (() => {
        const monthDays = Object.values(dayMap).filter((d) => {
          const [y, m] = d.date.split('-').map(Number)
          return y === year && m === month + 1
        })
        const worked = monthDays.filter((d) => d.checkInTime).length
        const totalHours = monthDays.reduce((sum, d) => sum + (d.hoursWorked ?? 0), 0)
        const totalPay = monthDays.reduce((sum, d) => sum + (d.dailyPayAmount ?? 0), 0)
        return (
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryVal}>{worked}</span>
              <span className={styles.summaryKey}>Kelgan kun</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryVal}>{Math.round(totalHours * 10) / 10}h</span>
              <span className={styles.summaryKey}>Ishlagan soat</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryVal}>{formatNumber(totalPay)}</span>
              <span className={styles.summaryKey}>Hisoblangan maosh</span>
            </div>
          </div>
        )
      })()}

      {/* Edit modal */}
      <Modal
        isOpen={!!editDay}
        onClose={() => setEditDay(null)}
        title={editDay ? `${editDay.dayLabel} — ${editDay.date.slice(5).replace('-', '/')}` : ''}
      >
        {editDay && (
          <div className={styles.editForm}>
            <div className={styles.editRow}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Kelish vaqti</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={editIn}
                  onChange={(e) => setEditIn(e.target.value)}
                />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Ketish vaqti</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={editOut}
                  onChange={(e) => setEditOut(e.target.value)}
                />
              </div>
            </div>
            {editIn && editOut && (
              <p className={styles.previewHours}>
                Ishlangan vaqt: {calcHours(editIn, editOut) ?? 0}h
              </p>
            )}
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.saveBtn}
                disabled={!editValid || saveMut.isPending}
                onClick={handleSave}
              >
                {saveMut.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WeeklyAttendancePage
