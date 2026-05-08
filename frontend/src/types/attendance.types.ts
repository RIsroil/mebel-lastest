export interface AttendanceResponse {
  id: string
  userId: string
  workshopId: string
  workDate: string
  checkInTime: string
  checkOutTime: string | null
  hoursWorked: number | null
  hoursSelfReported: boolean
  hoursDeadline: string
  hoursLocked: boolean
  ownerOverrideHours: number | null
  notes: string | null
}

export interface SubmitHoursRequest {
  hoursWorked: number
  notes?: string
}

export interface OverrideHoursRequest {
  hoursWorked: number
  notes?: string
}

export interface ManualEntryRequest {
  date: string        // YYYY-MM-DD
  checkInTime: string // HH:MM
  checkOutTime: string // HH:MM
  notes?: string
}

export interface WeeklyDayResponse {
  date: string
  dayLabel: string
  attendanceId: string | null
  checkInTime: string | null  // HH:MM
  checkOutTime: string | null // HH:MM
  hoursWorked: number | null
  hoursLocked: boolean
  manualEntry: boolean
  notes: string | null
  hoursTarget: number
  dailySalary: number | null
  dailyPayAmount: number | null
  bonusHours: number | null
  editable: boolean
}
