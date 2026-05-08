import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTopbar } from '@/context/TopbarContext'
import { attendanceApi } from '@/api/attendance.api'
import { useAuthStore } from '@/store/auth.store'
import { toApiDate, formatDate, formatTime } from '@/utils/formatDate'
import Button from '@/components/ui/Button'
import styles from './SubmitHoursPage.module.css'

// Calculates elapsed time from checkIn to now, capped at maxMinutes
function calcElapsed(checkInStr: string): { hours: number; minutes: number; totalMinutes: number } {
  const checkIn = new Date(checkInStr)
  const now = new Date()
  const diffMs = now.getTime() - checkIn.getTime()
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000))
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  }
}

function formatHM(h: number, m: number) {
  return `${h} soat${m > 0 ? ` ${m} daqiqa` : ''}`
}

const SubmitHoursPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.workshopAttendanceMode === 'MANUAL_MODE') {
      navigate('/weekly-attendance', { replace: true })
    }
  }, [user?.workshopAttendanceMode, navigate])

  const today        = toApiDate(new Date())
  const sevenDaysAgo = toApiDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))

  // Tick every minute to keep current time and max hours live
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Hour / minute steppers
  const [h, setH] = useState(0)
  const [m, setM] = useState(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setTitle('Soat kiritish')
    setActions(null)
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const { data: historyResp, isLoading } = useQuery({
    queryKey: ['attendance-history', sevenDaysAgo, today],
    queryFn:  () => attendanceApi.getMyHistory({ from: sevenDaysAgo, to: today }),
  })

  const submitMut = useMutation({
    mutationFn: ({ hoursWorked, notesText }: { hoursWorked: number; notesText?: string }) =>
      attendanceApi.submitHours({ hoursWorked, notes: notesText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
    },
  })

  const records   = historyResp?.data?.data ?? []
  const todayRec  = records.find((r) => r.workDate === today) ?? null
  const history   = records.filter((r) => r.workDate !== today)

  const elapsed   = todayRec?.checkInTime ? calcElapsed(todayRec.checkInTime) : null
  const maxH      = elapsed?.hours ?? 0
  const maxM      = elapsed?.minutes ?? 0

  const enteredMinutes = h * 60 + m
  const exceedsMax     = elapsed != null && enteredMinutes > elapsed.totalMinutes
  const enteredDecimal = h + m / 60

  const stepH = (delta: number) => {
    const next = Math.max(0, Math.min(23, h + delta))
    setH(next)
    setError('')
  }
  const stepM = (delta: number) => {
    let nm = m + delta
    if (nm < 0) { nm = 50; setH((prev) => Math.max(0, prev - 1)) }
    else if (nm >= 60) { nm = 0; setH((prev) => Math.min(23, prev + 1)) }
    else setM(nm)
    setError('')
  }

  const handleSubmit = () => {
    if (enteredMinutes === 0) { setError("Vaqt kiritilmagan — 0 bo'lishi mumkin emas"); return }
    if (exceedsMax) { setError("Kirish vaqtingizdan ko'p soat kirita olmaysiz"); return }
    setError('')
    submitMut.mutate({ hoursWorked: parseFloat(enteredDecimal.toFixed(2)), notesText: notes || undefined })
  }

  const alreadySubmitted = todayRec && (todayRec.hoursSelfReported || todayRec.ownerOverrideHours != null)
  const hoursLocked      = todayRec?.hoursLocked

  return (
    <div className={styles.page}>
    <div className={styles.layout}>
    <div className={styles.leftCol}>

      {/* ─── TODAY'S SHIFT CARD ─── */}
      {!isLoading && todayRec && (
        <div className={styles.shiftCard}>
          <div className={styles.shiftHeader}>
            <span className={styles.shiftTitle}>Bugungi smenangiz</span>
            {hoursLocked
              ? <span className={styles.badgeLocked}>● Yakunlangan</span>
              : alreadySubmitted
                ? <span className={styles.badgeDone}>● Topshirilgan</span>
                : <span className={styles.badgeActive}>● Faol</span>
            }
          </div>
          <div className={styles.shiftStats}>
            <div className={styles.shiftStat}>
              <span className={styles.shiftStatLabel}>Kelish vaqti</span>
              <span className={styles.shiftStatVal}>{formatTime(todayRec.checkInTime)}</span>
            </div>
            <div className={styles.shiftStat}>
              <span className={styles.shiftStatLabel}>Hozirgi vaqt</span>
              <span className={`${styles.shiftStatVal} ${styles.shiftStatCurrent}`}>
                {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
            <div className={styles.shiftStat}>
              <span className={styles.shiftStatLabel}>Mumkin max</span>
              <span className={`${styles.shiftStatVal} ${styles.shiftStatMax}`}>
                {elapsed ? `${maxH}:${String(maxM).padStart(2, '0')}` : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── NOT CHECKED IN ─── */}
      {!isLoading && !todayRec && (
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>ℹ</span>
          <span>Bugun hali ishga kirmagansiz. Avval <strong>Kirish / Chiqish</strong> sahifasida ishga kiring.</span>
        </div>
      )}

      {/* ─── MAX HOURS INFO ─── */}
      {todayRec && !alreadySubmitted && !hoursLocked && elapsed && (
        <div className={styles.warnBox}>
          <span className={styles.warnIcon}>⚠</span>
          <span>
            {formatTime(todayRec.checkInTime)} da keldingiz. Siz maksimal{' '}
            <strong>{formatHM(maxH, maxM)}</strong> kirita olasiz.
          </span>
        </div>
      )}

      {/* ─── ALREADY SUBMITTED ─── */}
      {alreadySubmitted && (
        <div className={styles.successBox}>
          <span className={styles.successIcon}>✓</span>
          <span>
            Soat muvaffaqiyatli topshirildi:{' '}
            <strong>
              {todayRec.ownerOverrideHours ?? todayRec.hoursWorked} soat
            </strong>
            {todayRec.ownerOverrideHours != null && (
              <span className={styles.overrideMark}> (Admin tomonidan tuzatilgan)</span>
            )}
          </span>
        </div>
      )}

      {/* ─── INPUT CARD ─── */}
      {todayRec && !alreadySubmitted && !hoursLocked && (
        <div className={styles.inputCard}>
          <div className={styles.inputCardTitle}>⏱ Ishlagan vaqtingizni kiriting</div>

          <div className={styles.stepperRow}>
            {/* Hours */}
            <div className={styles.stepperGroup}>
              <span className={styles.stepperLabel}>Soat</span>
              <div className={styles.stepper}>
                <button type="button" className={styles.stepBtn} onClick={() => stepH(-1)}>−</button>
                <span className={styles.stepVal}>{h}</span>
                <button type="button" className={styles.stepBtn} onClick={() => stepH(1)}>+</button>
              </div>
            </div>

            <div className={styles.stepperSep}>:</div>

            {/* Minutes */}
            <div className={styles.stepperGroup}>
              <span className={styles.stepperLabel}>Daqiqa</span>
              <div className={styles.stepper}>
                <button type="button" className={styles.stepBtn} onClick={() => stepM(-10)}>−</button>
                <span className={styles.stepVal}>{String(m).padStart(2, '0')}</span>
                <button type="button" className={styles.stepBtn} onClick={() => stepM(10)}>+</button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className={`${styles.preview} ${exceedsMax ? styles.previewError : ''}`}>
            <div className={styles.previewLabel}>Kiritilgan vaqt</div>
            <div className={styles.previewTime}>{h}:{String(m).padStart(2, '0')}</div>
            <div className={styles.previewDecimal}>≈ {enteredDecimal.toFixed(1)} soat</div>
          </div>

          {/* Notes */}
          <div className={styles.notesGroup}>
            <label className={styles.notesLabel}>Izoh (ixtiyoriy)</label>
            <textarea
              className={styles.notesInput}
              rows={2}
              placeholder="Tushlikda 30 daqiqa tanaffus..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Deadline */}
          {todayRec.hoursDeadline && (
            <div className={styles.deadlineInfo}>
              <span className={styles.deadlineIcon}>ℹ</span>
              <span>
                Muhlat:{' '}
                <strong>{formatDate(todayRec.hoursDeadline)}</strong> gacha o'zgartirish mumkin
              </span>
            </div>
          )}

          {error && <div className={styles.errText}>{error}</div>}

          <Button
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            loading={submitMut.isPending}
            onClick={handleSubmit}
          >
            ✓ Soatni Yuborish
          </Button>
        </div>
      )}

    </div>{/* leftCol */}

    {/* ─── RIGHT COLUMN: HISTORY ─── */}
    <div className={styles.rightCol}>
      <div className={styles.sectionTitle}>So'nggi 7 kun tarixi</div>

      {!isLoading && history.length === 0 && (
        <div className={styles.noData}>
          Tarix yo'q
        </div>
      )}

      {history.length > 0 && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Kirish</th>
                <th>Soat</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => {
                const hrs = a.ownerOverrideHours ?? a.hoursWorked
                const isExpired = a.hoursLocked && hrs == null
                return (
                  <tr key={a.id}>
                    <td>{formatDate(a.workDate)}</td>
                    <td>{formatTime(a.checkInTime)}</td>
                    <td className={styles.hoursCell}>
                      {hrs != null
                        ? <span className={styles.hoursOk}>{hrs} soat</span>
                        : <span className={styles.hoursNone}>—</span>}
                      {a.ownerOverrideHours != null && (
                        <span className={styles.overrideTag}>Admin</span>
                      )}
                    </td>
                    <td>
                      {isExpired
                        ? <span className={styles.expiredBadge}>O'tdi</span>
                        : hrs != null
                          ? <span className={styles.doneBadge}>✓</span>
                          : <span className={styles.pendingBadge}>Kutmoqda</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && records.length === 0 && (
        <div className={styles.noData}>
          Davomat yozuvlari yo'q. Avval ishga kiring.
        </div>
      )}
    </div>{/* rightCol */}

    </div>{/* layout */}
    </div>
  )
}

export default SubmitHoursPage
