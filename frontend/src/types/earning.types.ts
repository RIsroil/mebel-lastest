export type EarnType = 'DAILY_WAGE' | 'HOURLY_WAGE' | 'MONTHLY_WAGE' | 'COMMISSION' | 'BONUS'

export interface EarningResponse {
  id: string
  workerId: string
  workerName: string
  workshopId: string
  earnDate: string
  earnType: EarnType
  attendanceId: string | null
  hoursWorked: number | null
  hoursTarget: number | null
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
  monthlySalary: number | null
  periodStart: string | null
  daysInMonth: number | null
  earningIds: string[] | null // For aggregated monthly wages
  totalDays: number | null // Jami ishlangan kunlar
  paidDays: number | null // To'langan kunlar
  unpaidDays: number | null // To'lanmagan kunlar
  workerPayType: string | null // 'DAILY' or 'MONTHLY'
  totalHoursWorked: number | null // Jami ishlangan soatlar
}

export interface BonusRequest {
  workerId: string
  amount: number
  reason: string
  bonusDate: string
}
