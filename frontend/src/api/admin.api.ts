import api from './axiosInstance'
import type { ApiResponse, PageResponse, PageParams } from '@/types/common.types'
import type {
  AdminUserResponse,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
  BlockUserRequest,
} from '@/types/admin.types'
import type { WorkshopResponse, CreateWorkshopRequest } from '@/types/workshop.types'

export const adminApi = {
  users: {
    getAll: (params?: PageParams & { role?: string; workshopId?: string; active?: boolean }) =>
      api.get<ApiResponse<PageResponse<AdminUserResponse>>>('/api/admin/users', { params }),

    getById: (id: string) =>
      api.get<ApiResponse<AdminUserResponse>>(`/api/admin/users/${id}`),

    create: (body: CreateAdminUserRequest) =>
      api.post<ApiResponse<AdminUserResponse>>('/api/admin/users', body),

    update: (id: string, body: UpdateAdminUserRequest) =>
      api.put<ApiResponse<AdminUserResponse>>(`/api/admin/users/${id}`, body),

    remove: (id: string) =>
      api.delete(`/api/admin/users/${id}`),

    block: (id: string, body: BlockUserRequest) =>
      api.patch<ApiResponse<void>>(`/api/admin/users/${id}/block`, body),

    unblock: (id: string) =>
      api.patch<ApiResponse<void>>(`/api/admin/users/${id}/unblock`),
  },

  workshops: {
    create: (body: CreateWorkshopRequest) =>
      api.post<ApiResponse<WorkshopResponse>>('/api/admin/workshops', body),
  },
}
