import api from './axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { AttendanceResponse, SubmitHoursRequest, OverrideHoursRequest } from '@/types/attendance.types'

export const attendanceApi = {
  checkIn: () =>
    api.post<ApiResponse<AttendanceResponse>>('/api/attendance/check-in'),

  submitHours: (body: SubmitHoursRequest) =>
    api.post<ApiResponse<AttendanceResponse>>('/api/attendance/submit-hours', body),

  overrideHours: (id: string, body: OverrideHoursRequest) =>
    api.patch<ApiResponse<AttendanceResponse>>(`/api/attendance/${id}/override`, body),

  getMyHistory: (params: { from: string; to: string }) =>
    api.get<ApiResponse<AttendanceResponse[]>>('/api/attendance/my', { params }),

  getWorkshopByDate: (date: string) =>
    api.get<ApiResponse<AttendanceResponse[]>>('/api/attendance/workshop', { params: { date } }),

  getWorkerHistory: (workerId: string, params: { from: string; to: string }) =>
    api.get<ApiResponse<AttendanceResponse[]>>(`/api/attendance/workers/${workerId}`, { params }),
}
