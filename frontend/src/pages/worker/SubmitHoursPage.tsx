import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTopbar } from '@/context/TopbarContext'
import { attendanceApi } from '@/api/attendance.api'
import { toApiDate, formatDate, formatTime } from '@/utils/formatDate'
import Button from '@/components/ui/Button'
import styles from './SubmitHoursPage.module.css'

// Deadline countdown: ms → "X kun Y soat Z daqiqa" yoki "O'tdi"
const formatCountdown = (deadlineStr: string): { text: string; urgent: boolean; expired: boolean } => {
  const diff = new Date(deadlineStr).getTime() - Date.now()
  if (diff <= 0) return { text: "Muddati o'tdi", urgent: false, expired: true }
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const text  = days > 0
    ? `${days} kun ${hours} soat ${mins} daqiqa`
    : `${hours} soat ${mins} daqiqa`
  return { text, urgent: diff < 24 * 60 * 60 * 1000, expired: false }
}

const SubmitHoursPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()

  const today        = toApiDate(new Date())
  const sevenDaysAgo = toApiDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))

  // Active form state: which record is being edited
  const [activeId, setActiveId]   = useState<string | null>(null)
  const [hours, setHours]         = useState('')
  const [notes, setNotes]         = useState('')
  const [hoursError, setHoursError] = useState('')

  // Live countdown ticker
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const { data: historyResp, isLoading } = useQuery({
    queryKey: ['attendance-history', sevenDaysAgo, today],
    queryFn:  () => attendanceApi.getMyHistory({ from: sevenDaysAgo, to: today }),
  })

  const submitMut = useMutation({
    mutationFn: ({ hoursWorked, notesText }: { hoursWorked: number; notesText?: string }) =>
      attendanceApi.submitHours({ hoursWorked, notes: notesText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
      setActiveId(null)
      setHours('')
      setNotes('')
    },
  })

  useEffect(() => {
    setTitle('Soat kiritish')
    setActions(null)
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const records = historyResp?.data?.data ?? []

  // Tasnif: kiritish kerak bo'lganlar, allaqachon kiritilganlar, muddati o'tganlar
  const pending  = records.filter((r) => !r.hoursLocked && r.hoursSelfReported == null)
  const done     = records.filter((r) => r.hoursSelfReported != null || r.ownerOverrideHours != null)
  const expired  = records.filter((r) => r.hoursLocked && r.hoursSelfReported == null && r.ownerOverrideHours == null)

  const handleSubmit = () => {
    const h = parseFloat(hours)
    if (!hours || isNaN(h) || h <= 0 || h > 24) {
      setHoursError('0 dan katta, 24 dan kichik son kiriting')
      return
    }
    setHoursError('')
    submitMut.mutate({ hoursWorked: h, notesText: notes || undefined })
  }

  // tick ishlatilmagan bo'lsa lint xato bermasligi uchun
  void tick

  return (
    <div className={styles.page}>
      {/* Summary */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryNum}>{pending.length}</span>
          <span className={styles.summaryLabel}>Kiritish kerak</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryNum} style={{ color: 'var(--green)' }}>{done.length}</span>
          <span className={styles.summaryLabel}>Kiritilgan</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryNum} style={{ color: 'var(--red)' }}>{expired.length}</span>
          <span className={styles.summaryLabel}>Muddati o'tgan</span>
        </div>
      </div>

      {/* Pending records */}
      {pending.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Soat kiritish kerak</div>
          <div className={styles.recordList}>
            {pending.map((a) => {
              const cd = formatCountdown(a.hoursDeadline)
              const isOpen = activeId === a.id
              return (
                <div key={a.id} className={`${styles.recordCard} ${cd.urgent ? styles.urgentCard : ''}`}>
                  <div className={styles.recordHeader} onClick={() => setActiveId(isOpen ? null : a.id)}>
                    <div className={styles.recordInfo}>
                      <span className={styles.recordDate}>{formatDate(a.workDate)}</span>
                      <span className={styles.recordCheckIn}>Kirish: {formatTime(a.checkInTime)}</span>
                    </div>
                    <div className={styles.deadlineBox}>
                      <span className={styles.deadlineLabel}>Muddatigacha:</span>
                      <span className={`${styles.deadlineValue} ${cd.urgent ? styles.deadlineUrgent : ''}`}>
                        {cd.text}
                      </span>
                    </div>
                    <button type="button" className={styles.toggleBtn}>
                      {isOpen ? '▲' : '▼'}
                    </button>
                  </div>

                  {isOpen && (
                    <div className={styles.form}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Ish soati *</label>
                          <input
                            className={styles.formInput}
                            type="number"
                            min={0.5}
                            max={24}
                            step={0.5}
                            placeholder="8"
                            value={hours}
                            onChange={(e) => { setHours(e.target.value); setHoursError('') }}
                          />
                          {hoursError && <span className={styles.errText}>{hoursError}</span>}
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Izoh (ixtiyoriy)</label>
                          <input
                            className={styles.formInput}
                            placeholder="Qo'shimcha ma'lumot"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.formActions}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => { setActiveId(null); setHours(''); setNotes('') }}
                        >
                          Bekor qilish
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          loading={submitMut.isPending}
                          onClick={() => handleSubmit()}
                        >
                          Saqlash →
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Kiritilgan yozuvlar */}
      {(done.length > 0 || expired.length > 0) && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Tarixi</div>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Kirish</th>
                  <th>Ish soati</th>
                  <th>Izoh</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {[...done, ...expired].map((a) => {
                  const hours = a.ownerOverrideHours ?? a.hoursSelfReported
                  const isExpired = a.hoursLocked && hours == null
                  return (
                    <tr key={a.id}>
                      <td>{formatDate(a.workDate)}</td>
                      <td>{formatTime(a.checkInTime)}</td>
                      <td className={styles.hoursCell}>
                        {hours != null
                          ? <span className={styles.hoursOk}>{hours} soat</span>
                          : <span className={styles.hoursExpired}>—</span>}
                        {a.ownerOverrideHours != null && (
                          <span className={styles.overrideMark}> (Admin)</span>
                        )}
                      </td>
                      <td className={styles.notesCell}>{a.notes ?? '—'}</td>
                      <td>
                        {isExpired
                          ? <span className={styles.expiredBadge}>Muddati o'tdi</span>
                          : <span className={styles.doneBadge}>Yakunlangan</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && records.length === 0 && (
        <div className={styles.noData}>
          So'nggi 7 kunda davomat yozuvlari yo'q. Avval ishga kiring.
        </div>
      )}
    </div>
  )
}

export default SubmitHoursPage
