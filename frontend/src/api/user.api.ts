import api from './axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { UserProfile, UpdateProfileRequest } from '@/types/auth.types'

export const userApi = {
  getMe: () =>
    api.get<ApiResponse<UserProfile>>('/api/users/me'),

  updateMe: (body: UpdateProfileRequest) =>
    api.patch<ApiResponse<UserProfile>>('/api/users/update', body),

  resetWorkerPassword: (workerId: string, newPassword: string) =>
    api.put<ApiResponse<null>>(`/api/users/${workerId}/reset-password`, {
      newPassword,
    }),
}
