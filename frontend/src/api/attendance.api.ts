import api from './axiosInstance'
import type { AttendanceResponse, SubmitHoursRequest, OverrideHoursRequest } from '@/types/attendance.types'

export const attendanceApi = {
  checkIn: () =>
    api.post<AttendanceResponse>('/api/attendance/check-in'),

  submitHours: (body: SubmitHoursRequest) =>
    api.post<AttendanceResponse>('/api/attendance/submit-hours', body),

  overrideHours: (id: string, body: OverrideHoursRequest) =>
    api.patch<AttendanceResponse>(`/api/attendance/${id}/override`, body),

  getMyHistory: (params: { from: string; to: string }) =>
    api.get<AttendanceResponse[]>('/api/attendance/my', { params }),

  getWorkshopByDate: (date: string) =>
    api.get<AttendanceResponse[]>('/api/attendance/workshop', { params: { date } }),

  getWorkerHistory: (workerId: string, params: { from: string; to: string }) =>
    api.get<AttendanceResponse[]>(`/api/attendance/workers/${workerId}`, { params }),
}
