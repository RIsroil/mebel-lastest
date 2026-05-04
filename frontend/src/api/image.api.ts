import api from './axiosInstance'

export interface ImageResponse {
  id: string
  url: string
  status: 'ACTIVE' | 'DELETED'
}

export const imageApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImageResponse>('/api/images/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getById: (id: string) =>
    api.get<ImageResponse>(`/api/images/${id}`),
}
