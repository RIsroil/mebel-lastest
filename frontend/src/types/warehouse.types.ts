export type UnitType = 'PIECE' | 'KG' | 'GRAM' | 'LITRE' | 'ML' | 'METER' | 'CM' | 'M2' | 'M3'
export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT'

export interface WarehouseItemResponse {
  id: string
  workshopId: string
  name: string
  description: string | null
  unitType: UnitType
  quantity: number
  avgUnitPrice: number
  totalValue: number
  minQuantityAlert: number | null
  sku: string | null
  active: boolean
  lowStock: boolean
}

export interface CreateWarehouseItemRequest {
  name: string
  description?: string
  unitType: UnitType
  minQuantityAlert?: number
  sku?: string
}

export interface WarehouseTransactionResponse {
  id: string
  itemId: string
  itemName: string
  transactionType: TransactionType
  quantity: number
  unitPrice: number
  totalCost: number
  qtyBefore: number
  qtyAfter: number
  priceBefore: number
  priceAfter: number
  supplierName: string | null
  invoiceNumber: string | null
  createdAt: string
}

export interface CreateTransactionRequest {
  transactionType: TransactionType
  quantity: number
  unitPrice: number
  supplierName?: string
  invoiceNumber?: string
  furnitureOrderId?: string
  notes?: string
}
