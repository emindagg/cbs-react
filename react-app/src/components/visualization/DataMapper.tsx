/**
 * DataMapper Component
 * Datawrapper-style data mapping & validation interface
 * Combines column mapping + AG Grid spreadsheet + real-time validation
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
  CellStyleModule,
  ValidationModule,
} from 'ag-grid-community'
import type { ColDef, CellValueChangedEvent, ICellRendererParams } from 'ag-grid-community'
import { CheckCircle, AlertCircle } from 'lucide-react'

import { useVisualizationStore } from '../../stores/useVisualizationStore'
import { getPlateCodeByName, normalizeTurkishText } from '../../utils/turkishNormalizer'

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
  CellStyleModule,
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

// Status cell renderer
function StatusCellRenderer(params: ICellRendererParams) {
  if (!params.value) return null
  if (params.value === 'matched') {
    return <CheckCircle size={14} className="text-emerald-500" />
  }
  return <AlertCircle size={14} className="text-red-400" />
}

// Column highlight colors
const COL_COLORS: Record<string, string> = {
  location: '#DBEAFE',
  district: '#D1FAE5',
  data: '#FED7AA',
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

      // Update rawData in store
      const rowIndex = event.data.__rowIndex as number
      const updated = [...rawData]
      updated[rowIndex] = { ...updated[rowIndex], [field]: event.newValue }
      setRawData(updated)

      // Re-validate this row
      const newStatus = validateRow({ ...event.data, [field]: event.newValue })
      event.data.__status = newStatus
      event.api.refreshCells({ rowNodes: [event.node!], columns: ['__status'], force: true })
    },
    [rawData, setRawData, validateRow],
  )

  // Column definitions
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

    const dataCols: ColDef[] = columns.map((col) => {
      return {
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
          return bgColor ? { backgroundColor: bgColor } : { backgroundColor: undefined }
        },
      }
    })

    return [statusCol, ...dataCols]
  }, [columns, selectedProvince, selectedDistrict, selectedData, locationLevel])

  const defaultColDef = useMemo((): ColDef => ({
    resizable: true,
    sortable: true,
  }), [])

  // Match counts
  const matchCount = useMemo(() => rowData.filter((r) => r.__status === 'matched').length, [rowData])
  const totalCount = rowData.length

  const isModal = variant === 'modal'

  // ─── Modal variant: compact horizontal toolbar + full-height grid ───
  if (isModal) {
    return (
      <div className="flex flex-col h-full">
        {/* Compact Toolbar */}
        <div className="shrink-0 bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Location Level Toggle */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Seviye</span>
            <div className="inline-flex rounded-lg border border-zinc-300 overflow-hidden shadow-sm">
              <label
                className={`flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer text-[11px] font-semibold transition-all ${locationLevel === 'province' ? 'bg-slate-700 text-white shadow-inner' : 'bg-white text-zinc-600 hover:bg-zinc-100'
                  }`}
              >
                <input type="radio" name="dm-level-m" value="province" checked={locationLevel === 'province'} onChange={() => setLocationLevel('province')} className="sr-only" />
                <i className={`fa-solid fa-map-location-dot text-[9px] ${locationLevel === 'province' ? 'text-white' : 'text-zinc-400'}`} />
                İl
              </label>
              <div className="w-px bg-zinc-300" />
              <label
                className={`flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer text-[11px] font-semibold transition-all ${locationLevel === 'mixed' ? 'bg-slate-700 text-white shadow-inner' : 'bg-white text-zinc-600 hover:bg-zinc-100'
                  }`}
              >
                <input type="radio" name="dm-level-m" value="mixed" checked={locationLevel === 'mixed'} onChange={() => setLocationLevel('mixed')} className="sr-only" />
                <i className={`fa-solid fa-layer-group text-[9px] ${locationLevel === 'mixed' ? 'text-white' : 'text-zinc-400'}`} />
                İl + İlçe
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-zinc-200" />

          {/* Column Selects - inline */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COL_COLORS.location }} />
              <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">İl:</span>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="text-[11px] border border-zinc-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white min-w-[100px]"
              >
                <option value="">Seçin...</option>
                {columns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            {locationLevel === 'mixed' && (
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COL_COLORS.district }} />
                <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">İlçe:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="text-[11px] border border-zinc-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white min-w-[100px]"
                >
                  <option value="">Seçin...</option>
                  {columns.map((col) => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COL_COLORS.data }} />
              <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">Veri:</span>
              <select
                value={selectedData}
                onChange={(e) => setSelectedData(e.target.value)}
                className="text-[11px] border border-zinc-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white min-w-[100px]"
              >
                <option value="">Seçin...</option>
                {numericColumns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-zinc-200" />

          {/* Match summary - compact */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div className="flex items-center gap-1">
              <CheckCircle size={13} className="text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-700">{matchCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle size={13} className="text-red-400" />
              <span className="text-[11px] font-semibold text-red-600">{totalCount - matchCount}</span>
            </div>
            <span className="text-[10px] text-zinc-400">/ {totalCount}</span>
          </div>
        </div>

        {/* AG Grid - fills remaining space */}
        <div className="flex-1 min-h-0" style={{ fontSize: '11px' }}>
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
              headerHeight={32}
              rowHeight={28}
              suppressMovableColumns
              animateRows={false}
            />
          )}
        </div>
      </div>
    )
  }

  // ─── Default variant: vertical layout (sidebar) ───
  return (
    <div className="space-y-3">
      {/* A. Location Level Toggle */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">
          Konum Seviyesi <span className="text-red-500">*</span>
        </label>
        <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden w-full">
          <label
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-2 cursor-pointer transition-colors
              ${locationLevel === 'province'
                ? 'bg-slate-700 text-white'
                : 'bg-white text-zinc-700 hover:bg-zinc-50'}
            `}
          >
            <input
              type="radio"
              name="dm-location-level"
              value="province"
              checked={locationLevel === 'province'}
              onChange={() => setLocationLevel('province')}
              className="sr-only"
            />
            <i className={`fa-solid fa-map-location-dot text-[9px] ${locationLevel === 'province' ? 'text-white' : 'text-zinc-400'}`} />
            <span className="text-[10px] font-medium">Sadece Il</span>
          </label>
          <div className="w-px bg-zinc-200" />
          <label
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-2 cursor-pointer transition-colors
              ${locationLevel === 'mixed'
                ? 'bg-slate-700 text-white'
                : 'bg-white text-zinc-700 hover:bg-zinc-50'}
            `}
          >
            <input
              type="radio"
              name="dm-location-level"
              value="mixed"
              checked={locationLevel === 'mixed'}
              onChange={() => setLocationLevel('mixed')}
              className="sr-only"
            />
            <i className={`fa-solid fa-layer-group text-[9px] ${locationLevel === 'mixed' ? 'text-white' : 'text-zinc-400'}`} />
            <span className="text-[10px] font-medium">Il + Ilce</span>
          </label>
        </div>
      </div>

      {/* B. Column Mapping Dropdowns */}
      <div className="space-y-2">
        {/* Province column */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: COL_COLORS.location }} />
            Il Sutunu
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Secin...</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {/* District column - only for mixed mode */}
        {locationLevel === 'mixed' && (
          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
              <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: COL_COLORS.district }} />
              Ilce Sutunu
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">Secin...</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}

        {/* Data column */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: COL_COLORS.data }} />
            Veri Sutunu
          </label>
          <select
            value={selectedData}
            onChange={(e) => setSelectedData(e.target.value)}
            className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Secin...</option>
            {numericColumns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <p className="text-[10px] text-zinc-400 mt-0.5">Sadece sayisal sutunlar</p>
        </div>
      </div>

      {/* C. AG Grid Spreadsheet */}
      <div
        style={{ height: 320, width: '100%', fontSize: '11px' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
            <span className="ml-2 text-[11px] text-zinc-500">GeoJSON yukleniyor...</span>
          </div>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onCellValueChanged={onCellValueChanged}
            getRowId={(params) => String(params.data.__rowIndex)}
            headerHeight={28}
            rowHeight={26}
            suppressMovableColumns
            animateRows={false}
          />
        )}
      </div>

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
