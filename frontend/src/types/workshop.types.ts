export type { AttendanceMode } from './auth.types'

export interface WorkshopResponse {
  id: string
  name: string
  address: string | null
  phone: string | null
  description: string | null
  active: boolean
  ownerId: string
  attendanceMode: AttendanceMode
  createdAt: string
}

export interface CreateWorkshopRequest {
  name: string
  address?: string
  phone?: string
  description?: string
}
