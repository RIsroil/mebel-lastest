import api from './axiosInstance'
import type { ApiResponse, PageResponse } from '@/types/common.types'
import type { FinancialLogResponse, FinancialLogSummaryResponse, FinancialLogType } from '@/types/log.types'

export const logApi = {
  getLogs: (params?: { from?: string; to?: string; type?: FinancialLogType; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<FinancialLogResponse>>>('/api/owner/logs', { params }),

  getLastMonthSummary: () =>
    api.get<ApiResponse<FinancialLogSummaryResponse>>('/api/owner/logs/summary/last-month'),

  getPeriodSummary: (from: string, to: string) =>
    api.get<ApiResponse<FinancialLogSummaryResponse>>('/api/owner/logs/summary', { params: { from, to } }),
}
