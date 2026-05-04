/** Barcha API javoblari shu formatda keladi */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** Pagination qo'llab-quvvatlaydigan endpointlar uchun */
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number   // joriy sahifa (0-indexed)
  size: number     // sahifadagi elementlar soni
  first: boolean
  last: boolean
}

export interface PageParams {
  page?: number
  size?: number
  sort?: string
}
