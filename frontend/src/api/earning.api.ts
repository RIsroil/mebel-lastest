import api from './axiosInstance'
import type { EarningResponse, BonusRequest } from '@/types/earning.types'

export const earningApi = {
  getMyEarnings: (params?: { from?: string; to?: string }) =>
    api.get<EarningResponse[]>('/api/earnings/my', { params }),

  getWorkerEarnings: (workerId: string, params?: { from?: string; to?: string }) =>
    api.get<EarningResponse[]>(`/api/earnings/workers/${workerId}`, { params }),

  getWorkshopEarnings: (params?: { from?: string; to?: string }) =>
    api.get<EarningResponse[]>('/api/earnings/workshop', { params }),

  markPaid: (id: string) =>
    api.patch<EarningResponse>(`/api/earnings/${id}/pay`),

  addBonus: (body: BonusRequest) =>
    api.post<EarningResponse>('/api/earnings/bonus', body),
}
