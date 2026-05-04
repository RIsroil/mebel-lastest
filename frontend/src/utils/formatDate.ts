/** "2025-01-15T08:30:00" → "15.01.2025" */
export const formatDate = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** "2025-01-15T08:30:00" → "08:30" */
export const formatTime = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

/** "2025-01-15T08:30:00" → "15.01.2025, 08:30" */
export const formatDateTime = (iso: string): string =>
  `${formatDate(iso)}, ${formatTime(iso)}`

/** new Date() → "2025-01-15" (API uchun) */
export const toApiDate = (date: Date): string =>
  date.toISOString().split('T')[0]
