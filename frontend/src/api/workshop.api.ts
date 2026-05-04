import api from './axiosInstance'
import type { PageResponse, PageParams } from '@/types/common.types'
import type { WorkshopResponse, CreateWorkshopRequest } from '@/types/workshop.types'

export const workshopApi = {
  getAll: (params?: PageParams) =>
    api.get<PageResponse<WorkshopResponse>>('/api/workshops', { params }),

  getById: (id: string) =>
    api.get<WorkshopResponse>(`/api/workshops/${id}`),

  create: (body: CreateWorkshopRequest) =>
    api.post<WorkshopResponse>('/api/workshops', body),

  update: (id: string, body: CreateWorkshopRequest) =>
    api.put<WorkshopResponse>(`/api/workshops/${id}`, body),

  remove: (id: string) =>
    api.delete(`/api/workshops/${id}`),
}
