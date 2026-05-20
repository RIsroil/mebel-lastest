/** "2025-01-15T08:30:00" → "15.01.2025" */
export const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** "2025-01-15T08:30:00" → "08:30" (24-soat formatida: 0-23) */
export const formatTime = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "2025-01-15T08:30:00" → "15.01.2025, 08:30" */
export const formatDateTime = (iso: string): string =>
  `${formatDate(iso)}, ${formatTime(iso)}`

/** new Date() → "2025-01-15" (API uchun) — local vaqt, UTC emas */
export const toApiDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
