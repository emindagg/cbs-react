/**
 * AG Grid wrapper for DataMapper (modal and default variants)
 */

import type { ColDef, CellValueChangedEvent } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import type { RefObject } from 'react'

import { agGridTurkishLocaleText } from '@/shared/ag-grid'

interface RowWithStatus {
  __rowIndex: number
  __status: 'matched' | 'unmatched'
  [key: string]: unknown
}

export interface GridContext {
  selectedProvince: string
  selectedDistrict: string
  selectedData: string
  locationLevel: 'province' | 'mixed'
}

interface GridProps {
  gridRef: RefObject<AgGridReact | null>
  rowData: RowWithStatus[]
  columnDefs: ColDef[]
  defaultColDef: ColDef
  onCellValueChanged: (event: CellValueChangedEvent) => void
  isLoading?: boolean
  variant: 'default' | 'modal'
  gridContext: GridContext
}

export function Grid({
  gridRef,
  rowData,
  columnDefs,
  defaultColDef,
  onCellValueChanged,
  isLoading,
  variant,
  gridContext,
}: GridProps) {
  const isModal = variant === 'modal'
  const containerClass = isModal ? 'flex-1 min-h-0' : ''
  const containerStyle = isModal ? { fontSize: '11px' } : { height: 320, width: '100%', fontSize: '11px' }
  const headerHeight = isModal ? 32 : 28
  const rowHeight = isModal ? 28 : 26

  return (
    <div className={containerClass} style={containerStyle}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          <span className="ml-2 text-[11px] text-zinc-500">GeoJSON yükleniyor...</span>
        </div>
      ) : (
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          getRowId={(params) => String(params.data.__rowIndex)}
          headerHeight={headerHeight}
          rowHeight={rowHeight}
          context={gridContext}
          suppressMovableColumns
          animateRows={false}
          localeText={agGridTurkishLocaleText}
        />
      )}
    </div>
  )
}
