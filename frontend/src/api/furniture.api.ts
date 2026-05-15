import api from './axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  FurnitureOrderResponse,
  CreateOrderRequest,
  ChangeStatusRequest,
  AssignWorkerRequest,
  AddMaterialRequest,
  FurnitureTemplateResponse,
  CreateTemplateRequest,
  AddTemplateMaterialRequest,
} from '@/types/furniture.types'

export const furnitureApi = {
  orders: {
    getAll: () =>
      api.get<ApiResponse<FurnitureOrderResponse[]>>('/api/furniture/orders'),

    getById: (id: string) =>
      api.get<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}`),

    create: (body: CreateOrderRequest) =>
      api.post<ApiResponse<FurnitureOrderResponse>>('/api/furniture/orders', body),

    update: (id: string, body: CreateOrderRequest) =>
      api.put<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}`, body),

    remove: (id: string) =>
      api.delete(`/api/furniture/orders/${id}`),

    changeStatus: (id: string, body: ChangeStatusRequest) =>
      api.patch<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}/status`, body),

    assignWorker: (id: string, body: AssignWorkerRequest) =>
      api.post<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}/workers`, body),

    removeWorker: (id: string, workerId: string) =>
      api.delete(`/api/furniture/orders/${id}/workers/${workerId}`),

    addMaterial: (id: string, body: AddMaterialRequest) =>
      api.post<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}/materials`, body),

    removeMaterial: (id: string, usageId: string) =>
      api.delete<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}/materials/${usageId}`),

    adjustMaterial: (id: string, usageId: string, delta: number) =>
      api.patch<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}/materials/${usageId}/adjust`, { delta }),

    uploadImage: (id: string, file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}/images`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },

    deleteImage: (id: string, imageId: string) =>
      api.delete<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}/images/${imageId}`),

    togglePin: (id: string) =>
      api.patch<ApiResponse<FurnitureOrderResponse>>(`/api/furniture/orders/${id}/pin`),
  },

  templates: {
    getAll: () =>
      api.get<ApiResponse<FurnitureTemplateResponse[]>>('/api/furniture/templates'),

    getById: (id: string) =>
      api.get<ApiResponse<FurnitureTemplateResponse>>(`/api/furniture/templates/${id}`),

    create: (body: CreateTemplateRequest) =>
      api.post<ApiResponse<FurnitureTemplateResponse>>('/api/furniture/templates', body),

    update: (id: string, body: CreateTemplateRequest) =>
      api.put<ApiResponse<FurnitureTemplateResponse>>(`/api/furniture/templates/${id}`, body),

    remove: (id: string) =>
      api.delete(`/api/furniture/templates/${id}`),

    addMaterial: (id: string, body: AddTemplateMaterialRequest) =>
      api.post<ApiResponse<FurnitureTemplateResponse>>(`/api/furniture/templates/${id}/materials`, body),

    removeMaterial: (id: string, materialId: string) =>
      api.delete(`/api/furniture/templates/${id}/materials/${materialId}`),
  },
}
