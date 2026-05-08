import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTopbar } from '@/context/TopbarContext'
import { attendanceApi } from '@/api/attendance.api'
import { useAuthStore } from '@/store/auth.store'
import { formatNumber } from '@/utils/formatMoney'
import type { WeeklyDayResponse } from '@/types/attendance.types'
import styles from './WeeklyAttendancePage.module.css'

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() || 7  // 0(Yak)→7, 1-7
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

interface RowEdit {
  checkIn: string
  checkOut: string
  dirty: boolean
}

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

  const [monday, setMonday] = useState(() => getMondayOf(new Date()))
  const weekStartStr = toLocalDate(monday)

  const [edits, setEdits] = useState<Record<string, RowEdit>>({})

  const { data: resp, isLoading } = useQuery({
    queryKey: ['weekly-attendance', weekStartStr],
    queryFn: () => attendanceApi.getMyWeekly(weekStartStr),
  })

  const saveMut = useMutation({
    mutationFn: attendanceApi.upsertManualEntry,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-attendance', weekStartStr] })
      setEdits((prev) => {
        const next = { ...prev }
        delete next[vars.date]
        return next
      })
    },
  })

  useEffect(() => {
    setTitle('Haftalik davomat')
    setActions(null)
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const days: WeeklyDayResponse[] = resp?.data?.data ?? []

  const getEdit = (date: string): RowEdit => {
    if (edits[date]) return edits[date]
    const day = days.find((d) => d.date === date)
    return {
      checkIn:  parseTime(day?.checkInTime ?? null),
      checkOut: parseTime(day?.checkOutTime ?? null),
      dirty: false,
    }
  }

  const handleChange = (date: string, field: 'checkIn' | 'checkOut', value: string) => {
    const prev = getEdit(date)
    setEdits((e) => ({
      ...e,
      [date]: { ...prev, [field]: value, dirty: true },
    }))
  }

  const handleSave = (day: WeeklyDayResponse) => {
    const edit = getEdit(day.date)
    if (!edit.checkIn || !edit.checkOut) return
    saveMut.mutate({
      date: day.date,
      checkInTime: edit.checkIn,
      checkOutTime: edit.checkOut,
    })
  }

  const prevWeek = () => {
    setMonday((m) => {
      const d = new Date(m)
      d.setDate(d.getDate() - 7)
      return d
    })
    setEdits({})
  }

  const nextWeek = () => {
    const next = new Date(monday)
    next.setDate(next.getDate() + 7)
    if (next <= getMondayOf(new Date())) {
      setMonday(next)
      setEdits({})
    }
  }

  const isCurrentWeek = toLocalDate(getMondayOf(new Date())) === weekStartStr

  return (
    <div className={styles.page}>
      <div className={styles.weekNav}>
        <button type="button" className={styles.navBtn} onClick={prevWeek}>← Oldingi</button>
        <span className={styles.weekLabel}>{weekLabel(monday)}</span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={nextWeek}
          disabled={isCurrentWeek}
        >
          Keyingi →
        </button>
      </div>

      <div className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hafta kuni</th>
                <th>Kelish</th>
                <th>Ketish</th>
                <th>Ishlangan / Norma</th>
                <th>Bugungi maosh / Kunlik</th>
                <th>Bonus soat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const edit     = getEdit(day.date)
                const editable = day.editable && !day.hoursLocked
                const previewH = edit.dirty
                  ? calcHours(edit.checkIn, edit.checkOut)
                  : day.hoursWorked

                const today = toLocalDate(new Date()) === day.date
                const isSaving = saveMut.isPending && saveMut.variables?.date === day.date

                const canSave = editable &&
                  edit.dirty &&
                  edit.checkIn.length === 5 &&
                  edit.checkOut.length === 5 &&
                  (calcHours(edit.checkIn, edit.checkOut) ?? 0) > 0

                return (
                  <tr
                    key={day.date}
                    className={
                      today
                        ? styles.todayRow
                        : !day.editable
                        ? styles.futureRow
                        : day.hoursLocked
                        ? styles.lockedRow
                        : undefined
                    }
                  >
                    <td className={styles.dayCell}>
                      <span className={styles.dayLabel}>{day.dayLabel}</span>
                      <span className={styles.dayDate}>{day.date.slice(5).replace('-', '/')}</span>
                    </td>

                    {/* Kelish */}
                    <td>
                      {editable ? (
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={edit.checkIn}
                          onChange={(e) => handleChange(day.date, 'checkIn', e.target.value)}
                        />
                      ) : (
                        <span className={styles.timeDisplay}>
                          {day.checkInTime ? day.checkInTime.slice(0, 5) : '--:--'}
                        </span>
                      )}
                    </td>

                    {/* Ketish */}
                    <td>
                      {editable ? (
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={edit.checkOut}
                          onChange={(e) => handleChange(day.date, 'checkOut', e.target.value)}
                        />
                      ) : (
                        <span className={styles.timeDisplay}>
                          {day.checkOutTime ? day.checkOutTime.slice(0, 5) : '--:--'}
                        </span>
                      )}
                    </td>

                    {/* Ishlangan / Norma */}
                    <td className={styles.hoursCell}>
                      {previewH != null ? (
                        <span className={previewH >= (day.hoursTarget ?? 8) ? styles.hoursOk : styles.hoursShort}>
                          {previewH}h
                        </span>
                      ) : (
                        <span className={styles.dash}>—</span>
                      )}
                      <span className={styles.target}>/ {day.hoursTarget ?? 8}h</span>
                    </td>

                    {/* Bugungi maosh / Kunlik */}
                    <td className={styles.payCell}>
                      {day.dailyPayAmount != null ? (
                        <span className={styles.payAmount}>{formatNumber(day.dailyPayAmount)}</span>
                      ) : (
                        <span className={styles.dash}>—</span>
                      )}
                      {day.dailySalary != null && (
                        <span className={styles.dailySalary}>/ {formatNumber(day.dailySalary)}</span>
                      )}
                    </td>

                    {/* Bonus soat */}
                    <td>
                      {day.bonusHours != null && day.bonusHours > 0 ? (
                        <span className={styles.bonusBadge}>+{day.bonusHours}h</span>
                      ) : (
                        <span className={styles.dash}>—</span>
                      )}
                    </td>

                    {/* Saqlash tugmasi */}
                    <td>
                      {editable && (
                        <button
                          type="button"
                          className={styles.saveBtn}
                          disabled={!canSave || isSaving}
                          onClick={() => handleSave(day)}
                        >
                          {isSaving ? '...' : 'Saqlash'}
                        </button>
                      )}
                      {day.hoursLocked && (
                        <span className={styles.lockedBadge}>Qulflangan</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default WeeklyAttendancePage
