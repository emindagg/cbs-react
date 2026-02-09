/**
 * AG Grid status cell renderer for DataMapper (matched/unmatched icon)
 */

import type { ICellRendererParams } from 'ag-grid-community'
import { CheckCircle, AlertCircle } from 'lucide-react'

export function StatusCellRenderer(params: ICellRendererParams) {
  if (!params.value) return null
  if (params.value === 'matched') {
    return <CheckCircle size={14} className="text-emerald-500" />
  }
  return <AlertCircle size={14} className="text-red-400" />
}
