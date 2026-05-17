import type { UserRole, PayType } from './auth.types'

export interface AdminUserResponse {
  id: string
  username: string
  fullName: string | null
  phone: string | null
  role: UserRole
  active: boolean
  blocked: boolean
  blockedUntil: string | null
  blockReason: string | null
  workshopId: string | null
  workshopName: string | null
  payType: PayType | null
  hourlyRate: number | null
  dailyRate: number | null
  dailyHoursTarget: number | null
  dailySalary: number | null
  monthlySalary: number | null
  commissionPct: number | null
  hybridPay: boolean
  createdAt: string
}

export interface CreateAdminUserRequest {
  username: string
  password: string
  fullName?: string
  phone?: string
  role: UserRole
  workshopId?: string
  payType?: PayType
  dailyHoursTarget?: number
  dailySalary?: number
  monthlySalary?: number
  commissionPct?: number
  hybridPay?: boolean
}

export interface UpdateAdminUserRequest {
  fullName?: string
  phone?: string
  role?: UserRole
  workshopId?: string
  active?: boolean
  payType?: PayType
  dailyHoursTarget?: number
  dailySalary?: number
  monthlySalary?: number
  commissionPct?: number
  hybridPay?: boolean
  newPassword?: string
}

export interface BlockUserRequest {
  reason: string
  blockDays?: number
}
