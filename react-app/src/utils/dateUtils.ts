import { format } from 'date-fns'

/**
 * Formats a date for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export function formatDateForInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}
