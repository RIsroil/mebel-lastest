export type UserRole = 'OWNER' | 'WORKER' | 'ADMIN'
export type PayType  = 'DAILY' | 'MONTHLY'
export type AttendanceMode = 'BUTTON_MODE' | 'MANUAL_MODE'

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface CreateWorkerRequest {
  workshopId: string
  username: string
  password: string
  payType: PayType
  dailyHoursTarget: number
  dailySalary: number
  monthlySalary?: number
}

export interface UserProfile {
  id: string
  username: string
  fullName: string | null
  phone: string | null
  role: UserRole
  workshopId: string | null
  workshopName: string | null
  workshopAttendanceMode: AttendanceMode | null
  payType: PayType | null
  dailyHoursTarget: number | null
  dailySalary: number | null
  monthlySalary: number | null
}

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
}
