export type EarnType = 'DAILY_WAGE' | 'HOURLY_WAGE' | 'COMMISSION' | 'BONUS'

export interface EarningResponse {
  id: string
  workerId: string
  workerName: string
  workshopId: string
  earnDate: string
  earnType: EarnType
  attendanceId: string | null
  hoursWorked: number | null
  hourlyRate: number | null
  daysWorked: number | null
  dailyRate: number | null
  furnitureOrderId: string | null
  commissionPct: number | null
  commissionAmount: number | null
  baseAmount: number
  totalAmount: number
  description: string | null
  paid: boolean
  paidAt: string | null
}

export interface BonusRequest {
  workerId: string
  amount: number
  reason: string
  bonusDate: string
}
