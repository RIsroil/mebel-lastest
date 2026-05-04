import api from './axiosInstance'
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
  // Orders
  orders: {
    getAll: () =>
      api.get<FurnitureOrderResponse[]>('/api/furniture/orders'),

    getById: (id: string) =>
      api.get<FurnitureOrderResponse>(`/api/furniture/orders/${id}`),

    create: (body: CreateOrderRequest) =>
      api.post<FurnitureOrderResponse>('/api/furniture/orders', body),

    update: (id: string, body: CreateOrderRequest) =>
      api.put<FurnitureOrderResponse>(`/api/furniture/orders/${id}`, body),

    remove: (id: string) =>
      api.delete(`/api/furniture/orders/${id}`),

    changeStatus: (id: string, body: ChangeStatusRequest) =>
      api.patch<FurnitureOrderResponse>(`/api/furniture/orders/${id}/status`, body),

    assignWorker: (id: string, body: AssignWorkerRequest) =>
      api.post<FurnitureOrderResponse>(`/api/furniture/orders/${id}/workers`, body),

    removeWorker: (id: string, workerId: string) =>
      api.delete(`/api/furniture/orders/${id}/workers/${workerId}`),

    addMaterial: (id: string, body: AddMaterialRequest) =>
      api.post<FurnitureOrderResponse>(`/api/furniture/orders/${id}/materials`, body),
  },

  // Templates
  templates: {
    getAll: () =>
      api.get<FurnitureTemplateResponse[]>('/api/furniture/templates'),

    getById: (id: string) =>
      api.get<FurnitureTemplateResponse>(`/api/furniture/templates/${id}`),

    create: (body: CreateTemplateRequest) =>
      api.post<FurnitureTemplateResponse>('/api/furniture/templates', body),

    update: (id: string, body: CreateTemplateRequest) =>
      api.put<FurnitureTemplateResponse>(`/api/furniture/templates/${id}`, body),

    remove: (id: string) =>
      api.delete(`/api/furniture/templates/${id}`),

    addMaterial: (id: string, body: AddTemplateMaterialRequest) =>
      api.post<FurnitureTemplateResponse>(`/api/furniture/templates/${id}/materials`, body),

    removeMaterial: (id: string, materialId: string) =>
      api.delete(`/api/furniture/templates/${id}/materials/${materialId}`),
  },
}
