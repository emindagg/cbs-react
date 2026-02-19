/**
 * Column definitions for DataMapper grid
 *
 * cellStyle reads from AG Grid `context` (not closures) so that
 * refreshCells() always picks up the latest column selection.
 */

import type { ColDef, CellClassParams, ValueGetterParams } from 'ag-grid-community'
import { useMemo } from 'react'

import { StatusCellRenderer } from '../components/StatusCell'
import { COL_COLORS } from '../types'

const ERROR_BG = '#fee2e2' // red-100

export function useColumns(
  columns: string[],
): { columnDefs: ColDef[]; defaultColDef: ColDef } {
  const columnDefs = useMemo((): ColDef[] => {
    const statusCol: ColDef = {
      headerName: '',
      field: '__status',
      width: 40,
      minWidth: 40,
      maxWidth: 40,
      pinned: 'left',
      editable: false,
      sortable: false,
      cellRenderer: StatusCellRenderer,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    }

    const rowNumberCol: ColDef = {
      headerName: 'Sıra No',
      colId: '__rowNumber',
      width: 56,
      minWidth: 56,
      maxWidth: 64,
      pinned: 'left',
      editable: false,
      sortable: false,
      suppressMovable: true,
      valueGetter: (params: ValueGetterParams) => Number(params.data?.__rowIndex ?? 0) + 1,
      cellStyle: { textAlign: 'center', fontWeight: 500 },
    }

    const dataCols: ColDef[] = columns.map((col) => ({
      headerName: col,
      field: col,
      editable: true,
      minWidth: 90,
      flex: 1,
      cellStyle: (params: CellClassParams) => {
        const ctx = params.context
        if (!ctx) return undefined
        const { selectedProvince, selectedDistrict, selectedData, locationLevel } = ctx
        const isUnmatched = params.data?.__status === 'unmatched'
        const isLocationCol = col === selectedProvince
        const isDistrictCol = col === selectedDistrict && locationLevel === 'mixed'

        if (isLocationCol) return { backgroundColor: isUnmatched ? ERROR_BG : COL_COLORS.location }
        if (isDistrictCol) return { backgroundColor: isUnmatched ? ERROR_BG : COL_COLORS.district }
        if (col === selectedData) return { backgroundColor: COL_COLORS.data }
        return undefined
      },
    }))

    return [statusCol, rowNumberCol, ...dataCols]
  }, [columns])

  const defaultColDef = useMemo((): ColDef => ({
    resizable: true,
    sortable: true,
  }), [])

  return { columnDefs, defaultColDef }
}
