/**
 * AG Grid status cell renderer for DataMapper (matched/unmatched icon)
 */

import type { ICellRendererParams } from 'ag-grid-community'
import { Check, X } from 'lucide-react'

export function StatusCellRenderer(params: ICellRendererParams) {
  if (!params.value) return null
  if (params.value === 'matched') {
    return (
      <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center">
        <Check size={10} strokeWidth={3} className="text-emerald-500" />
      </div>
    )
  }
  return (
    <div className="w-4 h-4 rounded-full bg-red-50 flex items-center justify-center">
      <X size={10} strokeWidth={3} className="text-red-400" />
    </div>
  )
}
