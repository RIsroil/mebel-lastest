import api from './axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { EarningResponse, BonusRequest } from '@/types/earning.types'

export const earningApi = {
  getMyEarnings: (params?: { from?: string; to?: string }) =>
    api.get<ApiResponse<EarningResponse[]>>('/api/earnings/my', { params }),

  getWorkerEarnings: (workerId: string, params?: { from?: string; to?: string }) =>
    api.get<ApiResponse<EarningResponse[]>>(`/api/earnings/workers/${workerId}`, { params }),

  getWorkshopEarnings: (params?: { from?: string; to?: string }) =>
    api.get<ApiResponse<EarningResponse[]>>('/api/earnings/workshop', { params }),

  markPaid: (id: string) =>
    api.patch<ApiResponse<EarningResponse>>(`/api/earnings/${id}/pay`),

  markPaidBatch: (earningIds: string[]) =>
    api.patch<ApiResponse<EarningResponse[]>>('/api/earnings/pay-batch', earningIds),

  payPartial: (earningIds: string[], daysToPay: number) =>
    api.patch<ApiResponse<EarningResponse[]>>('/api/earnings/pay-partial', { earningIds, daysToPay }),

  addBonus: (body: BonusRequest) =>
    api.post<ApiResponse<EarningResponse>>('/api/earnings/bonus', body),
}
