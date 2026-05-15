import api from './axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { FurnitureSave, FurnitureSaveRequest, SaveCutRequest } from '@/types/saves.types'

export const savesApi = {
  getAll: () =>
    api.get<ApiResponse<FurnitureSave[]>>('/api/saves'),

  getById: (id: string) =>
    api.get<ApiResponse<FurnitureSave>>(`/api/saves/${id}`),

  create: (body: FurnitureSaveRequest) =>
    api.post<ApiResponse<FurnitureSave>>('/api/saves', body),

  update: (id: string, body: FurnitureSaveRequest) =>
    api.put<ApiResponse<FurnitureSave>>(`/api/saves/${id}`, body),

  delete: (id: string) =>
    api.delete(`/api/saves/${id}`),

  addCut: (saveId: string, body: SaveCutRequest) =>
    api.post<ApiResponse<FurnitureSave>>(`/api/saves/${saveId}/cuts`, body),

  updateCut: (saveId: string, cutId: string, body: SaveCutRequest) =>
    api.patch<ApiResponse<FurnitureSave>>(`/api/saves/${saveId}/cuts/${cutId}`, body),

  removeCut: (saveId: string, cutId: string) =>
    api.delete<ApiResponse<FurnitureSave>>(`/api/saves/${saveId}/cuts/${cutId}`),
}
