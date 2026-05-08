import api from './axiosInstance'
import type { ApiResponse, PageResponse, PageParams } from '@/types/common.types'
import type { AttendanceMode, WorkshopResponse, CreateWorkshopRequest } from '@/types/workshop.types'

export const workshopApi = {
  getAll: (params?: PageParams) =>
    api.get<ApiResponse<PageResponse<WorkshopResponse>>>('/api/workshops', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<WorkshopResponse>>(`/api/workshops/${id}`),

  create: (body: CreateWorkshopRequest) =>
    api.post<ApiResponse<WorkshopResponse>>('/api/workshops', body),

  update: (id: string, body: CreateWorkshopRequest) =>
    api.put<ApiResponse<WorkshopResponse>>(`/api/workshops/${id}`, body),

  remove: (id: string) =>
    api.delete(`/api/workshops/${id}`),

  updateAttendanceMode: (id: string, mode: AttendanceMode) =>
    api.patch<ApiResponse<WorkshopResponse>>(`/api/workshops/${id}/attendance-mode`, null, {
      params: { mode },
    }),
}
