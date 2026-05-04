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
}
