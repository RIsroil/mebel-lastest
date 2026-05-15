import api from './axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  WarehouseItemResponse,
  CreateWarehouseItemRequest,
  WarehouseTransactionResponse,
  CreateTransactionRequest,
} from '@/types/warehouse.types'

export const warehouseApi = {
  items: {
    getAll: () =>
      api.get<ApiResponse<WarehouseItemResponse[]>>('/api/warehouse/items'),

    getById: (id: string) =>
      api.get<ApiResponse<WarehouseItemResponse>>(`/api/warehouse/items/${id}`),

    create: (body: CreateWarehouseItemRequest) =>
      api.post<ApiResponse<WarehouseItemResponse>>('/api/warehouse/items', body),

    update: (id: string, body: CreateWarehouseItemRequest) =>
      api.put<ApiResponse<WarehouseItemResponse>>(`/api/warehouse/items/${id}`, body),

    remove: (id: string) =>
      api.delete(`/api/warehouse/items/${id}`),
  },

  transactions: {
    getByItem: (itemId: string) =>
      api.get<ApiResponse<WarehouseTransactionResponse[]>>(`/api/warehouse/items/${itemId}/transactions`),

    create: (itemId: string, body: CreateTransactionRequest) =>
      api.post<ApiResponse<WarehouseTransactionResponse>>(`/api/warehouse/items/${itemId}/transactions`, body),

    getTodayOut: () =>
      api.get<ApiResponse<WarehouseTransactionResponse[]>>('/api/warehouse/transactions/today-out'),
  },
}
