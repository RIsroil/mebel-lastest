export type FurnitureStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SOLD' | 'CANCELLED'

export interface AssignedWorker {
  assignmentId: string
  workerId: string
  workerName: string | null
  assignedAt: string | null
  unassignedAt: string | null
  commissionPct: number | null
  active: boolean
  daysWorked: number
  wageCost: number
  commissionCost: number
  workerMonthlySalary: number | null
  otherAssignmentsCount: number
  workerPayType: string | null
}

export interface MaterialUsage {
  id: string
  warehouseItemId: string
  itemName: string
  unitType: string | null
  quantityUsed: number
  unitPriceAtTime: number
  totalCost: number
  notes: string | null
  givenAt: string | null
}

export interface OrderImage {
  id: string
  url: string
  originalFilename: string
  primary: boolean
  sortOrder: number
}

export interface FurnitureOrderResponse {
  id: string
  workshopId: string
  orderNumber: string
  title: string
  description: string | null
  status: FurnitureStatus
  salePrice: number
  estimatedCost: number
  actualMaterialCost: number
  templateId: string | null
  startedAt: string | null
  completedAt: string | null
  soldAt: string | null
  clientName: string | null
  clientPhone: string | null
  notes: string | null
  pinned: boolean
  workerWageCost: number
  workerCommissionCost: number
  netProfit: number
  assignedWorkers: AssignedWorker[]
  materialUsages: MaterialUsage[]
  images: OrderImage[]
}

export interface CreateOrderRequest {
  title: string
  description?: string
  salePrice: number
  estimatedCost: number
  templateId?: string
  clientName?: string
  clientPhone?: string
  notes?: string
}

export interface ChangeStatusRequest {
  status: FurnitureStatus
}

export interface AssignWorkerRequest {
  workerId: string
  commissionPct?: number | null
}

export interface AddMaterialRequest {
  warehouseItemId: string
  quantityUsed: number
  notes?: string
}

export interface TemplateMaterial {
  id: string
  warehouseItemId: string
  itemName: string
  quantityNeeded: number
  notes: string | null
}

export interface FurnitureTemplateResponse {
  id: string
  workshopId: string
  name: string
  description: string | null
  estimatedProdDays: number | null
  active: boolean
  materials: TemplateMaterial[]
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  estimatedProdDays?: number
}

export interface AddTemplateMaterialRequest {
  warehouseItemId: string
  quantityNeeded: number
  notes?: string
}
