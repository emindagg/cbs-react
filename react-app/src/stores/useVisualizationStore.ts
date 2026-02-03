/**
 * Visualization Store
 * Manages visualization wizard state and data
 */

import { create } from 'zustand';
import type {
  ColumnMapping,
  MatchResults,
  VisualizationSettings,
  CurrentVisualization,
} from '../types/visualization';

interface VisualizationStore {
  // Wizard state
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToStep: (step: number) => void;

  // File data
  rawData: any[] | null;
  columns: string[];
  setFileData: (data: any[], columns: string[]) => void;
  clearFileData: () => void;

  // Column mapping
  columnMapping: ColumnMapping;
  setColumnMapping: (mapping: Partial<ColumnMapping>) => void;
  resetColumnMapping: () => void;

  // Match results
  matchResults: MatchResults;
  setMatchResults: (results: MatchResults) => void;
  clearMatchResults: () => void;

  // Visualization settings
  vizSettings: VisualizationSettings;
  setVizSettings: (settings: Partial<VisualizationSettings>) => void;
  resetVizSettings: () => void;

  // GeoJSON cache
  provincesGeoJSON: any | null;
  districtsGeoJSON: any | null;
  setProvincesGeoJSON: (data: any) => void;
  setDistrictsGeoJSON: (data: any) => void;

  // Province and district indexes
  provinceIndex: Record<string, any> | null;
  districtIndex: Record<string, any[]> | null;
  setProvinceIndex: (index: Record<string, any>) => void;
  setDistrictIndex: (index: Record<string, any[]>) => void;

  // Current visualization
  currentVisualization: CurrentVisualization;
  setCurrentVisualization: (viz: Partial<CurrentVisualization>) => void;
  clearCurrentVisualization: () => void;

  // Reset everything
  reset: () => void;
}

const defaultColumnMapping: ColumnMapping = {
  locationColumn: null,
  districtColumn: null,
  dataColumn: null,
  locationLevel: 'province',
};

const defaultVizSettings: VisualizationSettings = {
  type: 'choropleth',
  classCount: 5,
  classificationMethod: 'quantile',
  colorScheme: 'viridis',
  legendType: 'discrete',
};

const defaultMatchResults: MatchResults = {
  successful: [],
  ambiguous: [],
  failed: [],
};

const defaultCurrentVisualization: CurrentVisualization = {
  type: null,
  data: null,
  column: null,
};

export const useVisualizationStore = create<VisualizationStore>((set) => ({
  // Wizard state
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  goToStep: (step) => set({ currentStep: step }),

  // File data
  rawData: null,
  columns: [],
  setFileData: (data, columns) => set({ rawData: data, columns }),
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
      vizSettings: { ...state.vizSettings, ...settings },
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

  // Reset everything
  reset: () =>
    set({
      currentStep: 1,
      rawData: null,
      columns: [],
      columnMapping: defaultColumnMapping,
      matchResults: defaultMatchResults,
      vizSettings: defaultVizSettings,
      currentVisualization: defaultCurrentVisualization,
    }),
}));
