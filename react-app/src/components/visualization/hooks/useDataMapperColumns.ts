/**
 * Column definitions for DataMapper grid
 */

import type { ColDef } from 'ag-grid-community'
import { useMemo } from 'react'

import { COL_COLORS } from '../DataMapperConstants'
import { StatusCellRenderer } from '../DataMapperStatusCell'

export function useDataMapperColumns(
  columns: string[],
  selectedProvince: string,
  selectedDistrict: string,
  selectedData: string,
  locationLevel: 'province' | 'mixed',
): { columnDefs: ColDef[]; defaultColDef: ColDef } {
  const columnDefs = useMemo((): ColDef[] => {
    const statusCol: ColDef = {
      headerName: '',
      field: '__status',
      width: 45,
      minWidth: 45,
      maxWidth: 45,
      pinned: 'left',
      editable: false,
      sortable: false,
      cellRenderer: StatusCellRenderer,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    }

    const dataCols: ColDef[] = columns.map((col) => ({
      headerName: col,
      field: col,
      editable: true,
      minWidth: 90,
      flex: 1,
      cellStyle: () => {
        let bgColor: string | undefined
        if (col === selectedProvince) bgColor = COL_COLORS.location
        else if (col === selectedDistrict && locationLevel === 'mixed') bgColor = COL_COLORS.district
        else if (col === selectedData) bgColor = COL_COLORS.data
        return bgColor ? { backgroundColor: bgColor } : undefined
      },
    }))

    return [statusCol, ...dataCols]
  }, [columns, selectedProvince, selectedDistrict, selectedData, locationLevel])

  const defaultColDef = useMemo((): ColDef => ({
    resizable: true,
    sortable: true,
  }), [])

  return { columnDefs, defaultColDef }
}
