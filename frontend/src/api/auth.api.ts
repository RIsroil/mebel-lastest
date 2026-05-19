import api from './axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  TokenPair,
  LoginRequest,
  RegisterRequest,
  CreateWorkerRequest,
  UserProfile,
} from '@/types/auth.types'

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<ApiResponse<TokenPair>>('/api/auth/login', body),

  register: (body: RegisterRequest) =>
    api.post<ApiResponse<TokenPair>>('/api/auth/register', body),

  createWorker: (body: CreateWorkerRequest) =>
    api.post<ApiResponse<UserProfile>>('/api/auth/workers', body),

  deleteWorker: (workerId: string) =>
    api.delete<ApiResponse<null>>(`/api/auth/id`, {
      params: { id: workerId },
    }),

  me: () =>
    api.get<ApiResponse<UserProfile>>('/api/auth/me'),

  forgotPassword: (username: string) =>
    api.post<ApiResponse<null>>('/api/auth/forgot-password', { username }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<ApiResponse<TokenPair>>('/api/auth/reset-password', {
      token,
      newPassword,
    }),
}
