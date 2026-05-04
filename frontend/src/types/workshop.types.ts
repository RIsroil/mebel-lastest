export interface WorkshopResponse {
  id: string
  name: string
  address: string | null
  phone: string | null
  description: string | null
  active: boolean
  ownerId: string
  createdAt: string
}

export interface CreateWorkshopRequest {
  name: string
  address?: string
  phone?: string
  description?: string
}
