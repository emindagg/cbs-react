/**
 * DataMapper Component
 * Combines column mapping + AG Grid spreadsheet + real-time validation
 */

import type { CellValueChangedEvent, ColDef, ICellRendererParams } from 'ag-grid-community'
import type { AgGridReact } from 'ag-grid-react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { getPlateCodeByName, normalizeTurkishText } from '@/utils/turkishNormalizer'

import { CorrectionPanel } from './components/CorrectionPanel'
import { Grid } from './components/Grid'
import { ModalToolbar } from './components/ModalToolbar'
import { SidebarForm } from './components/SidebarForm'
import { useColumns } from './hooks/useColumns'

interface DataMapperProps {
  geoJsonKeys: string[]
  isLoading?: boolean
  /** 'modal' renders compact horizontal toolbar + full-height grid */
  variant?: 'default' | 'modal'
}

interface RowWithStatus {
  __rowIndex: number
  __status: 'matched' | 'unmatched'
  __excluded: boolean
  [key: string]: unknown
}

export default function DataMapper({ geoJsonKeys, isLoading, variant = 'default' }: DataMapperProps) {
  const {
    rawData,
    columns,
    columnMapping,
    setColumnMapping,
    setRawData,
    excludedRows,
    toggleExcludedRow,
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
    const looksNumeric = (value: unknown): boolean => {
      if (value === null || value === undefined || value === '') return false
      if (typeof value === 'number') return true
      const str = String(value).trim()
      if (!str) return false
      let cleaned = str.replace(/[₺$€£%\s]/g, '')
      cleaned = cleaned.replace(/[,.](?=\d{3}(?:[,.]|$))/g, '')
      cleaned = cleaned.replace(',', '.')
      return /^-?\d+(?:\.\d+)?$/.test(cleaned)
    }
    return columns.filter((col) => {
      const sample = rawData.slice(0, Math.min(10, rawData.length))
      const nonEmpty = sample.filter((row) => {
        const v = row[col]
        return v !== null && v !== undefined && v !== ''
      })
      if (nonEmpty.length === 0) return false
      const numericCount = nonEmpty.filter((row) => looksNumeric(row[col])).length
      return numericCount / nonEmpty.length > 0.6
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
    const excludedSet = new Set(excludedRows)
    return rawData.map((row, i) => ({
      ...row,
      __rowIndex: i,
      __status: validateRow(row),
      __excluded: excludedSet.has(i),
    }))
  }, [rawData, validateRow, excludedRows])

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
  // Must explicitly update AG Grid's internal context via API (React prop doesn't reactively sync in v35)
  useEffect(() => {
    const api = gridRef.current?.api
    if (!api) return
    api.setGridOption('context', { selectedProvince, selectedDistrict, selectedData, locationLevel })
    api.refreshCells({ force: true })
    api.refreshHeader()
  }, [selectedProvince, selectedDistrict, selectedData, locationLevel])

  // Handle cell edit
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      const currentRawData = useVisualizationStore.getState().rawData
      if (!currentRawData) return
      const field = event.colDef.field
      if (!field || field.startsWith('__')) return

      const rowIndex = event.data.__rowIndex as number
      const updated = [...currentRawData]
      updated[rowIndex] = { ...updated[rowIndex], [field]: event.newValue }
      setRawData(updated)

      const newStatus = validateRow({ ...event.data, [field]: event.newValue })
      event.data.__status = newStatus
      event.api.refreshCells({ rowNodes: [event.node!], force: true })
    },
    [setRawData, validateRow],
  )

  const { columnDefs, defaultColDef } = useColumns(columns)

  const exclusionColDef = useMemo((): ColDef => ({
    field: '__excluded',
    headerName: '',
    width: 36,
    minWidth: 36,
    maxWidth: 36,
    pinned: 'left',
    editable: false,
    sortable: false,
    suppressMovable: true,
    cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    cellRenderer: (params: ICellRendererParams) => {
      const isExcluded = params.data?.__excluded === true
      return (
        <button
          onClick={() => toggleExcludedRow(params.data.__rowIndex as number)}
          title={isExcluded ? 'Göster' : 'Gizle'}
          style={{ border: 'none', background: 'none', cursor: 'pointer', lineHeight: 1 }}
        >
          <i
            className={`fa-solid ${isExcluded ? 'fa-eye-slash' : 'fa-eye'}`}
            style={{ fontSize: 11, color: isExcluded ? '#d1d5db' : '#9ca3af' }}
          />
        </button>
      )
    },
  }), [toggleExcludedRow])

  const allColumnDefs = useMemo(
    () => [exclusionColDef, ...columnDefs],
    [exclusionColDef, columnDefs],
  )

  const applyCorrection = useCallback(
    (targetColumn: string, _originalValue: string, newValue: string, rowIndices: number[]) => {
      const currentRawData = useVisualizationStore.getState().rawData
      if (!currentRawData || !targetColumn) return
      const updated = [...currentRawData]
      for (const idx of rowIndices) {
        updated[idx] = { ...updated[idx], [targetColumn]: newValue }
      }
      setRawData(updated)
    },
    [setRawData],
  )

  const applyAllCorrections = useCallback(
    (corrections: Array<{ targetColumn: string; original: string; suggestion: string; rowIndices: number[] }>) => {
      const currentRawData = useVisualizationStore.getState().rawData
      if (!currentRawData) return
      const updated = [...currentRawData]
      for (const c of corrections) {
        if (!c.targetColumn) continue
        for (const idx of c.rowIndices) {
          updated[idx] = { ...updated[idx], [c.targetColumn]: c.suggestion }
        }
      }
      setRawData(updated)
    },
    [setRawData],
  )

  const unmatchedIndices = useMemo(() => {
    const set = new Set<number>()
    for (const row of rowData) {
      if (row.__excluded) continue
      if (row.__status === 'unmatched') set.add(row.__rowIndex)
    }
    return set
  }, [rowData])

  const gridContext = useMemo(() => ({
    selectedProvince,
    selectedDistrict,
    selectedData,
    locationLevel,
  }), [selectedProvince, selectedDistrict, selectedData, locationLevel])

  // Match counts (excluded rows are not counted)
  const activeRowData = useMemo(() => rowData.filter((r) => !r.__excluded), [rowData])
  const matchCount = useMemo(() => activeRowData.filter((r) => r.__status === 'matched').length, [activeRowData])
  const totalCount = activeRowData.length

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
        <CorrectionPanel
          rawData={rawData}
          locationColumn={selectedProvince}
          districtColumn={selectedDistrict}
          locationLevel={locationLevel}
          geoJsonKeys={geoJsonKeys}
          unmatchedIndices={unmatchedIndices}
          onApplyCorrection={applyCorrection}
          onApplyAll={applyAllCorrections}
        />
        <Grid
          gridRef={gridRef}
          rowData={rowData}
          columnDefs={allColumnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          isLoading={isLoading}
          variant="modal"
          gridContext={gridContext}
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
        columnDefs={allColumnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        isLoading={isLoading}
        variant="default"
        gridContext={gridContext}
      />

      <CorrectionPanel
        rawData={rawData}
        locationColumn={selectedProvince}
        districtColumn={selectedDistrict}
        locationLevel={locationLevel}
        geoJsonKeys={geoJsonKeys}
        unmatchedIndices={unmatchedIndices}
        onApplyCorrection={applyCorrection}
        onApplyAll={applyAllCorrections}
      />

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
