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
