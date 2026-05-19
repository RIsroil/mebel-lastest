import api from './axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { UserProfile, UpdateProfileRequest } from '@/types/auth.types'

export const userApi = {
  getMe: () =>
    api.get<ApiResponse<UserProfile>>('/users/me'),

  updateMe: (body: UpdateProfileRequest) =>
    api.patch<ApiResponse<UserProfile>>('/users/update', body),

  resetWorkerPassword: (workerId: string, newPassword: string) =>
    api.put<ApiResponse<null>>(`/users/${workerId}/reset-password`, {
      newPassword,
    }),
}
