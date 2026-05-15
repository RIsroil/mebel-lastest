import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTopbar } from '@/context/TopbarContext'
import { attendanceApi } from '@/api/attendance.api'
import { useAuthStore } from '@/store/auth.store'
import { toApiDate, formatDate, formatTime } from '@/utils/formatDate'
import Button from '@/components/ui/Button'
import styles from './CheckInPage.module.css'

const CheckInPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.workshopAttendanceMode === 'MANUAL_MODE') {
      navigate('/weekly-attendance', { replace: true })
    }
  }, [user?.workshopAttendanceMode, navigate])

  const [now, setNow] = useState(new Date())

  // Soatni har soniyada yangilab turish
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const today = toApiDate(new Date())

  // Bugungi check-in holati
  const { data: todayResp, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance-today', today],
    queryFn:  () => attendanceApi.getMyHistory({ from: today, to: today }),
  })

  // So'nggi 7 kun tarixi
  const sevenDaysAgo = toApiDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))
  const { data: historyResp } = useQuery({
    queryKey: ['attendance-history', sevenDaysAgo, today],
    queryFn:  () => attendanceApi.getMyHistory({ from: sevenDaysAgo, to: today }),
  })

  const checkInMut = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
    },
  })

  const checkOutMut = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
    },
  })

  useEffect(() => {
    setTitle("Ishga kirish")
    setActions(null)
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const todayAttendance = todayResp?.data?.data?.[0] ?? null
  const history         = historyResp?.data?.data ?? []

  const timeStr = now.toLocaleTimeString('uz-UZ', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const dateStr = now.toLocaleDateString('uz-UZ', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })

  const alreadyCheckedIn = !!todayAttendance

  return (
    <div className={styles.page}>
      {/* Soat kartasi */}
        <div className={styles.clockCard}>
          <div className={styles.clockTime}>{timeStr}</div>
          <div className={styles.clockDate}>{dateStr}</div>

          {todayLoading ? (
            <div className={styles.statusLoading}>Yuklanmoqda...</div>
          ) : alreadyCheckedIn ? (
            <div className={styles.checkedInStatus}>
              <span className={styles.checkIcon}>✓</span>
              <div>
                <div className={styles.statusTitle}>Bugun kelgansiz</div>
                <div className={styles.statusSub}>
                  {formatTime(todayAttendance!.checkInTime)} da kirgansiz
                  {todayAttendance!.checkOutTime && (
                    <span> · {formatTime(todayAttendance!.checkOutTime)} da chiqqansiz</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              className={styles.checkInBtn}
              loading={checkInMut.isPending}
              onClick={() => checkInMut.mutate()}
            >
              Ishga kirish →
            </Button>
          )}
          {alreadyCheckedIn && !todayAttendance!.checkOutTime && (
            <Button
              variant="danger"
              size="sm"
              style={{ marginTop: 12, width: '100%' }}
              loading={checkOutMut.isPending}
              onClick={() => checkOutMut.mutate()}
            >
              Ishdan chiqish
            </Button>
          )}
        </div>

      {/* So'nggi 7 kun jadvali */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>So'nggi 7 kun davomati</span>
          <span className={styles.txCount}>
            {history.filter((h) => h.hoursWorked != null || h.hoursSelfReported).length} ta
            soat kiritilgan
          </span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Kirish vaqti</th>
              <th>Ish soati</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  Davomat yozuvlari yo'q
                </td>
              </tr>
            ) : (
              history.map((a) => {
                const hours = a.ownerOverrideHours ?? a.hoursWorked
                return (
                  <tr key={a.id}>
                    <td>{formatDate(a.workDate)}</td>
                    <td>{formatTime(a.checkInTime)}</td>
                    <td className={styles.hoursCell}>
                      {hours != null
                        ? <span className={styles.hoursOk}>{hours} soat</span>
                        : a.hoursLocked
                          ? <span className={styles.hoursLocked}>Muddati o'tdi</span>
                          : <span className={styles.hoursPending}>Kiritilmagan</span>}
                    </td>
                    <td>
                      {a.hoursLocked
                        ? <span className={styles.lockedBadge}>Yakunlangan</span>
                        : hours != null
                          ? <span className={styles.submittedBadge}>Topshirilgan</span>
                          : <span className={styles.pendingBadge}>Kutilmoqda</span>}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CheckInPage
