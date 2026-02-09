/**
 * DataMapper Component
 * Datawrapper-style data mapping & validation interface
 * Combines column mapping + AG Grid spreadsheet + real-time validation
 */

import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
  CellStyleModule,
  RenderApiModule,
  ValidationModule,
} from 'ag-grid-community'
import type { CellValueChangedEvent } from 'ag-grid-community'
import type { AgGridReact } from 'ag-grid-react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { getPlateCodeByName, normalizeTurkishText } from '@/utils/turkishNormalizer'

import { Grid } from './components/Grid'
import { ModalToolbar } from './components/ModalToolbar'
import { SidebarForm } from './components/SidebarForm'
import { useColumns } from './hooks/useColumns'

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
  CellStyleModule,
  RenderApiModule,
  ...(process.env.NODE_ENV !== 'production' ? [ValidationModule] : []),
])

interface DataMapperProps {
  geoJsonKeys: string[]
  isLoading?: boolean
  /** 'modal' renders compact horizontal toolbar + full-height grid */
  variant?: 'default' | 'modal'
}

interface RowWithStatus {
  __rowIndex: number
  __status: 'matched' | 'unmatched'
  [key: string]: unknown
}

export default function DataMapper({ geoJsonKeys, isLoading, variant = 'default' }: DataMapperProps) {
  const {
    rawData,
    columns,
    columnMapping,
    setColumnMapping,
    setRawData,
  } = useVisualizationStore()

  const gridRef = useRef<AgGridReact>(null)

  const [locationLevel, setLocationLevel] = useState<'province' | 'mixed'>(
    columnMapping.locationLevel === 'mixed' ? 'mixed' : 'province',
  )
  const [selectedProvince, setSelectedProvince] = useState(columnMapping.locationColumn || '')
  const [selectedDistrict, setSelectedDistrict] = useState(columnMapping.districtColumn || '')
  const [selectedData, setSelectedData] = useState(columnMapping.dataColumn || '')
  const [rowData, setRowData] = useState<RowWithStatus[]>([])

  // Keyset for fast lookup
  const geoJsonKeysSet = useMemo(() => new Set(geoJsonKeys), [geoJsonKeys])

  // Numeric columns detection
  const numericColumns = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    return columns.filter((col) => {
      const sample = rawData.slice(0, Math.min(10, rawData.length))
      const numericCount = sample.filter((row) => {
        const value = row[col]
        return typeof value === 'number' || !isNaN(Number(value))
      }).length
      return numericCount / sample.length > 0.8
    })
  }, [rawData, columns])

  // Validate a single row
  const validateRow = useCallback(
    (row: Record<string, unknown>): 'matched' | 'unmatched' => {
      if (!selectedProvince || geoJsonKeysSet.size === 0) return 'unmatched'

      const province = String(row[selectedProvince] ?? '')
      const normalizedProvince = normalizeTurkishText(province)

      if (locationLevel === 'mixed' && selectedDistrict) {
        const district = String(row[selectedDistrict] ?? '')
        const normalizedDistrict = normalizeTurkishText(district)

        // Try province-name-based key (e.g. "gaziantep_sehitkamil")
        const nameKey = `${normalizedProvince}_${normalizedDistrict}`
        if (geoJsonKeysSet.has(nameKey)) return 'matched'

        // Try plate-code-based key (e.g. "27_sehitkamil")
        const plateCode = getPlateCodeByName(province)
        if (plateCode) {
          const plateKey = `${plateCode}_${normalizedDistrict}`
          if (geoJsonKeysSet.has(plateKey)) return 'matched'
        }

        return 'unmatched'
      }

      return geoJsonKeysSet.has(normalizedProvince) ? 'matched' : 'unmatched'
    },
    [selectedProvince, selectedDistrict, locationLevel, geoJsonKeysSet],
  )

  // Build row data with status
  const buildRowData = useCallback((): RowWithStatus[] => {
    if (!rawData) return []
    return rawData.map((row, i) => ({
      ...row,
      __rowIndex: i,
      __status: validateRow(row),
    }))
  }, [rawData, validateRow])

  // Rebuild rows when mapping or keys change
  useEffect(() => {
    setRowData(buildRowData())
  }, [buildRowData])

  // Sync column mapping to store
  useEffect(() => {
    setColumnMapping({
      locationColumn: selectedProvince || null,
      districtColumn: selectedDistrict || null,
      dataColumn: selectedData || null,
      locationLevel,
    })
  }, [selectedProvince, selectedDistrict, selectedData, locationLevel, setColumnMapping])

  // Force refresh cell styles when column selection changes
  useEffect(() => {
    gridRef.current?.api?.refreshCells({ force: true })
  }, [selectedProvince, selectedDistrict, selectedData, locationLevel])

  // Handle cell edit
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      if (!rawData) return
      const field = event.colDef.field
      if (!field || field.startsWith('__')) return

      const rowIndex = event.data.__rowIndex as number
      const updated = [...rawData]
      updated[rowIndex] = { ...updated[rowIndex], [field]: event.newValue }
      setRawData(updated)

      const newStatus = validateRow({ ...event.data, [field]: event.newValue })
      event.data.__status = newStatus
      event.api.refreshCells({ rowNodes: [event.node!], columns: ['__status'], force: true })
    },
    [rawData, setRawData, validateRow],
  )

  const { columnDefs, defaultColDef } = useColumns(
    columns,
    selectedProvince,
    selectedDistrict,
    selectedData,
    locationLevel,
  )

  // Match counts
  const matchCount = useMemo(() => rowData.filter((r) => r.__status === 'matched').length, [rowData])
  const totalCount = rowData.length

  const isModal = variant === 'modal'

  if (isModal) {
    return (
      <div className="flex flex-col h-full">
        <ModalToolbar
          locationLevel={locationLevel}
          setLocationLevel={setLocationLevel}
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          columns={columns}
          numericColumns={numericColumns}
          matchCount={matchCount}
          totalCount={totalCount}
        />
        <Grid
          gridRef={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          isLoading={isLoading}
          variant="modal"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <SidebarForm
        locationLevel={locationLevel}
        setLocationLevel={setLocationLevel}
        selectedProvince={selectedProvince}
        setSelectedProvince={setSelectedProvince}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        selectedData={selectedData}
        setSelectedData={setSelectedData}
        columns={columns}
        numericColumns={numericColumns}
      />
      <Grid
        gridRef={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        isLoading={isLoading}
        variant="default"
      />

      {/* D. Match Summary Bar */}
      <div className="flex items-center justify-between bg-zinc-50 rounded-md px-3 py-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-zinc-700">
            {matchCount} / {totalCount}
          </span>
          <span className="text-zinc-500">eslesti</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <CheckCircle size={12} className="text-emerald-500" />
            <span className="text-emerald-700 font-medium">{matchCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle size={12} className="text-red-400" />
            <span className="text-red-600 font-medium">{totalCount - matchCount}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
