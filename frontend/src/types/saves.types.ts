export interface SaveCut {
  id: string
  materialName: string
  lengthMm: number
  widthMm: number
  heightMm: number | null
  quantity: number
  notes: string | null
}

export interface FurnitureSave {
  id: string
  name: string
  description: string | null
  active: boolean
  createdAt: string
  cuts: SaveCut[]
}

export interface FurnitureSaveRequest {
  name: string
  description?: string
}

export interface SaveCutRequest {
  materialName: string
  lengthMm: number
  widthMm: number
  heightMm?: number
  quantity?: number
  notes?: string
}
