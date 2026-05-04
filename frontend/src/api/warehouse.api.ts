import api from './axiosInstance'
import type {
  WarehouseItemResponse,
  CreateWarehouseItemRequest,
  WarehouseTransactionResponse,
  CreateTransactionRequest,
} from '@/types/warehouse.types'

export const warehouseApi = {
  items: {
    getAll: () =>
      api.get<WarehouseItemResponse[]>('/api/warehouse/items'),

    getById: (id: string) =>
      api.get<WarehouseItemResponse>(`/api/warehouse/items/${id}`),

    create: (body: CreateWarehouseItemRequest) =>
      api.post<WarehouseItemResponse>('/api/warehouse/items', body),

    update: (id: string, body: CreateWarehouseItemRequest) =>
      api.put<WarehouseItemResponse>(`/api/warehouse/items/${id}`, body),

    remove: (id: string) =>
      api.delete(`/api/warehouse/items/${id}`),
  },

  transactions: {
    getByItem: (itemId: string) =>
      api.get<WarehouseTransactionResponse[]>(`/api/warehouse/items/${itemId}/transactions`),

    create: (itemId: string, body: CreateTransactionRequest) =>
      api.post<WarehouseTransactionResponse>(`/api/warehouse/items/${itemId}/transactions`, body),
  },
}
