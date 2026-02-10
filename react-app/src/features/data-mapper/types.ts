/**
 * Shared constants for DataMapper (column highlight colors)
 * Clearly distinct colors for each mapped column type.
 */

export const COL_COLORS: Record<string, string> = {
  location: '#dbeafe',   // blue-100 — İl sütunu
  district: '#d1fae5',   // emerald-100 — İlçe sütunu
  data:     '#fef3c7',   // amber-100 — Veri sütunu
}

export const COL_ACCENTS: Record<string, string> = {
  location: '#3b82f6',   // blue-500
  district: '#10b981',   // emerald-500
  data:     '#f59e0b',   // amber-500
}
