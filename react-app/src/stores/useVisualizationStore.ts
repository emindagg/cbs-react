/**
 * Visualization Store
 * Manages visualization wizard state and data
 */

import { create } from 'zustand'

import type { ExcelSelectionPreview, PendingExcelSelection } from '@/utils/columnMapper/types'
import type { ColumnLocaleReport, NumberLocale } from '@/utils/numberFormatter'
import {
  clampLegendClassCount,
  isValidCustomBreaksLength,
} from '@/utils/legendClassCount'


import type {
  ColumnMapping,
  MatchResults,
  VisualizationSettings,
  CurrentVisualization,
  ColorConfiguration,
  LegendConfiguration,
  CustomRange,
  MapTitleConfiguration,
} from '../types/visualization'

type PendingExcel = PendingExcelSelection & { preview: ExcelSelectionPreview }

interface VisualizationStore {
  // Wizard state
  currentStep: number
  setCurrentStep: (step: number) => void
  goToStep: (step: number) => void

  // Pending Excel header selection
  pendingExcel: PendingExcel | null
  setPendingExcel: (data: PendingExcel | null) => void

  // File data
  rawData: Record<string, unknown>[] | null
  columns: string[]
  setFileData: (data: Record<string, unknown>[], columns: string[]) => void
  setRawData: (data: Record<string, unknown>[]) => void
  clearFileData: () => void

  // Column mapping
  columnMapping: ColumnMapping
  setColumnMapping: (mapping: Partial<ColumnMapping>) => void
  resetColumnMapping: () => void

  // Match results
  matchResults: MatchResults
  setMatchResults: (results: MatchResults) => void
  clearMatchResults: () => void

  // Visualization settings
  vizSettings: VisualizationSettings
  setVizSettings: (settings: Partial<VisualizationSettings>) => void
  resetVizSettings: () => void

  // GeoJSON cache
  provincesGeoJSON: Record<string, unknown> | null
  districtsGeoJSON: Record<string, unknown> | null
  setProvincesGeoJSON: (data: Record<string, unknown>) => void
  setDistrictsGeoJSON: (data: Record<string, unknown>) => void

  // Province and district indexes
  provinceIndex: Record<string, unknown> | null
  districtIndex: Record<string, unknown[]> | null
  setProvinceIndex: (index: Record<string, unknown>) => void
  setDistrictIndex: (index: Record<string, unknown[]>) => void

  // Current visualization
  currentVisualization: CurrentVisualization
  setCurrentVisualization: (viz: Partial<CurrentVisualization>) => void
  clearCurrentVisualization: () => void

  // Visualization render transaction state
  isVisualizationRenderInProgress: boolean
  setVisualizationRenderInProgress: (inProgress: boolean) => void

  // Color configuration
  colorConfig: ColorConfiguration
  setColorConfig: (config: Partial<ColorConfiguration>) => void
  setLegendConfig: (config: Partial<LegendConfiguration>) => void
  setCustomRange: (range: Partial<CustomRange>) => void

  // Map title configuration
  mapTitle: MapTitleConfiguration
  setMapTitle: (config: Partial<MapTitleConfiguration>) => void

  // Row exclusion
  excludedRows: number[]
  toggleExcludedRow: (rowIndex: number) => void
  clearExcludedRows: () => void

  // Numeric locale parsing (data column)
  numericLocalePreference: NumberLocale
  setNumericLocalePreference: (locale: NumberLocale) => void
  detectedNumericLocale: ColumnLocaleReport | null
  setDetectedNumericLocale: (report: ColumnLocaleReport | null) => void

  // Reset everything
  reset: () => void
}

const defaultColumnMapping: ColumnMapping = {
  locationColumn: null,
  districtColumn: null,
  dataColumn: null,
  locationLevel: 'province',
}

const defaultVizSettings: VisualizationSettings = {
  type: 'choropleth',
  classCount: 5,
  classificationMethod: 'jenks',
  colorScheme: 'greenBlue',
  legendType: 'discrete',
  interpolation: 'equidistant',
  choroplethOpacity: 1,
  dotOpacity: 1,
  backdropFillOpacity: 1,
  dataOnlyMode: false,
  dataOnlyStyle: 'hidden',
  showLabels: false,
  showValues: false,
  labelColor: '#000000',
  valueColor: '#000000',
}

const defaultMatchResults: MatchResults = {
  successful: [],
  ambiguous: [],
  failed: [],
}

const defaultCurrentVisualization: CurrentVisualization = {
  type: null,
  data: null,
  column: null,
  locationLevel: null,
  renderSettings: null,
}

const defaultLegendConfig: LegendConfiguration = {
  visible: true,
  position: 'above',
  size: 170,
  orientation: 'horizontal',
  labels: {
    type: 'ruler',
  },
  format: '0a',
  title: {
    show: true,
    text: 'Lejant',
    fontSize: 16,
  },
  reverseOrder: false,
}

const defaultCustomRange: CustomRange = {
  enabled: false,
  min: null,
  center: null,
  max: null,
  outOfRangeMode: 'gray',
}

const defaultColorConfig: ColorConfiguration = {
  column: null,
  palette: 'greenBlue',
  scaleType: 'steps',
  interpolation: 'equidistant',
  customRange: defaultCustomRange,
  legend: defaultLegendConfig,
}

const defaultMapTitle: MapTitleConfiguration = {
  visible: false,
  title: 'Harita Başlığı',
  subtitle: '',
  position: 'top-center',
  fontSize: 24,
}

function sanitizeVizSettings(
  currentSettings: VisualizationSettings,
  incomingSettings: Partial<VisualizationSettings>,
): VisualizationSettings {
  const mergedSettings: VisualizationSettings = {
    ...currentSettings,
    ...incomingSettings,
  }

  if (incomingSettings.classCount !== undefined) {
    mergedSettings.classCount = clampLegendClassCount(incomingSettings.classCount)
  }

  if (incomingSettings.bubbleLegendCount !== undefined) {
    mergedSettings.bubbleLegendCount = clampLegendClassCount(incomingSettings.bubbleLegendCount)
  }

  if ('customBreaks' in incomingSettings) {
    const nextCustomBreaks = incomingSettings.customBreaks
    if (nextCustomBreaks === undefined) {
      mergedSettings.customBreaks = undefined
    } else if (isValidCustomBreaksLength(nextCustomBreaks.length)) {
      mergedSettings.customBreaks = nextCustomBreaks
      mergedSettings.classCount = clampLegendClassCount(nextCustomBreaks.length - 1)
    } else {
      mergedSettings.customBreaks = currentSettings.customBreaks
    }
  }

  return mergedSettings
}

export const useVisualizationStore = create<VisualizationStore>((set) => ({
  // Wizard state
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  goToStep: (step) => set({ currentStep: step }),

  // Pending Excel
  pendingExcel: null,
  setPendingExcel: (data) => set({ pendingExcel: data }),

  // File data
  rawData: null,
  columns: [],
  setFileData: (data, columns) => set({ rawData: data, columns }),
  setRawData: (data) => set({ rawData: data }),
  clearFileData: () => set({ rawData: null, columns: [] }),

  // Column mapping
  columnMapping: defaultColumnMapping,
  setColumnMapping: (mapping) =>
    set((state) => ({
      columnMapping: { ...state.columnMapping, ...mapping },
    })),
  resetColumnMapping: () => set({ columnMapping: defaultColumnMapping }),

  // Match results
  matchResults: defaultMatchResults,
  setMatchResults: (results) => set({ matchResults: results }),
  clearMatchResults: () => set({ matchResults: defaultMatchResults }),

  // Visualization settings
  vizSettings: defaultVizSettings,
  setVizSettings: (settings) =>
    set((state) => ({
      vizSettings: sanitizeVizSettings(state.vizSettings, settings),
    })),
  resetVizSettings: () => set({ vizSettings: defaultVizSettings }),

  // GeoJSON cache
  provincesGeoJSON: null,
  districtsGeoJSON: null,
  setProvincesGeoJSON: (data) => set({ provincesGeoJSON: data }),
  setDistrictsGeoJSON: (data) => set({ districtsGeoJSON: data }),

  // Province and district indexes
  provinceIndex: null,
  districtIndex: null,
  setProvinceIndex: (index) => set({ provinceIndex: index }),
  setDistrictIndex: (index) => set({ districtIndex: index }),

  // Current visualization
  currentVisualization: defaultCurrentVisualization,
  setCurrentVisualization: (viz) =>
    set((state) => ({
      currentVisualization: { ...state.currentVisualization, ...viz },
    })),
  clearCurrentVisualization: () =>
    set({ currentVisualization: defaultCurrentVisualization }),

  // Visualization render transaction state
  isVisualizationRenderInProgress: false,
  setVisualizationRenderInProgress: (inProgress) => set({ isVisualizationRenderInProgress: inProgress }),

  // Color configuration
  colorConfig: defaultColorConfig,
  setColorConfig: (config) =>
    set((state) => ({
      colorConfig: { ...state.colorConfig, ...config },
    })),
  setLegendConfig: (config) =>
    set((state) => ({
      colorConfig: {
        ...state.colorConfig,
        legend: { ...state.colorConfig.legend, ...config },
      },
    })),
  setCustomRange: (range) =>
    set((state) => ({
      colorConfig: {
        ...state.colorConfig,
        customRange: { ...state.colorConfig.customRange!, ...range },
      },
    })),

  // Map title configuration
  mapTitle: defaultMapTitle,
  setMapTitle: (config) =>
    set((state) => ({
      mapTitle: { ...state.mapTitle, ...config },
    })),

  // Row exclusion
  excludedRows: [],
  toggleExcludedRow: (rowIndex) =>
    set((state) => ({
      excludedRows: state.excludedRows.includes(rowIndex)
        ? state.excludedRows.filter((i) => i !== rowIndex)
        : [...state.excludedRows, rowIndex],
    })),
  clearExcludedRows: () => set({ excludedRows: [] }),

  // Numeric locale parsing
  numericLocalePreference: 'ambiguous',
  setNumericLocalePreference: (locale) => set({ numericLocalePreference: locale }),
  detectedNumericLocale: null,
  setDetectedNumericLocale: (report) => set({ detectedNumericLocale: report }),

  // Reset everything
  reset: () =>
    set({
      currentStep: 1,
      pendingExcel: null,
      rawData: null,
      excludedRows: [],
      columns: [],
      columnMapping: defaultColumnMapping,
      matchResults: defaultMatchResults,
      vizSettings: defaultVizSettings,
      currentVisualization: defaultCurrentVisualization,
      isVisualizationRenderInProgress: false,
      colorConfig: defaultColorConfig,
      mapTitle: defaultMapTitle,
      numericLocalePreference: 'ambiguous',
      detectedNumericLocale: null,
    }),
}))
