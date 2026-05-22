export type FinancialLogType =
  | 'WAREHOUSE_PURCHASE'
  | 'MATERIAL_USED'
  | 'WAGE_PAID'
  | 'COMMISSION_PAID'
  | 'EXTRA_PAID'
  | 'FURNITURE_SOLD'

export interface FinancialLogResponse {
  id: string
  logType: FinancialLogType
  amount: number        // musbat=kirim, manfiy=chiqim
  description: string | null
  referenceId: string | null
  relatedName: string | null
  logDate: string
  createdAt: string
}

export interface FinancialLogSummaryResponse {
  period: string        // "2026-04"
  totalIncome: number
  totalExpense: number
  netAmount: number
  count: number
}
