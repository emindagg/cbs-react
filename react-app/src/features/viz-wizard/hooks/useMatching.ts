/**
 * Matching Hook
 * Handles data matching logic for VizWizardStep2
 */

import type maplibregl from 'maplibre-gl'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { VisualizationManager } from '@/services/VisualizationManager'
import type { DistrictInfo, LocationInfo } from '@/types/geojson'
import type { MatchResults } from '@/types/visualization'
import { ColumnMapper } from '@/utils/columnMapper'

interface UseMatchingProps {
  rawData: Record<string, unknown>[] | null
  columnMapping: {
    locationColumn: string | null
    districtColumn: string | null
    dataColumn: string | null
    locationLevel: 'province' | 'district' | 'mixed'
  }
  map: maplibregl.Map | null
  provincesGeoJSON: Record<string, unknown> | null
  districtsGeoJSON: Record<string, unknown> | null
  provinceIndex: Record<string, unknown> | null
  districtIndex: Record<string, unknown[]> | null
  setProvincesGeoJSON: (data: Record<string, unknown>) => void
  setDistrictsGeoJSON: (data: Record<string, unknown>) => void
  setProvinceIndex: (index: Record<string, unknown>) => void
  setDistrictIndex: (index: Record<string, unknown[]>) => void
}

export function useMatching({
  rawData,
  columnMapping,
  map,
  provincesGeoJSON,
  districtsGeoJSON,
  provinceIndex,
  districtIndex,
  setProvincesGeoJSON,
  setDistrictsGeoJSON,
  setProvinceIndex,
  setDistrictIndex,
}: UseMatchingProps) {
  const [isMatching, setIsMatching] = useState(false)
  const [hasMatched, setHasMatched] = useState(false)

  const loadProvinceData = async (vizManager: VisualizationManager) => {
    if (!provincesGeoJSON) {
      const geojson = await vizManager.loadProvincesGeoJSON()
      if (geojson) {
        setProvincesGeoJSON(geojson as unknown as Record<string, unknown>)
        const provIndex = vizManager.getProvinceIndex()
        if (provIndex) {
          setProvinceIndex(provIndex as unknown as Record<string, unknown>)
          return provIndex
        }
      }
    } else if (!provinceIndex) {
      await vizManager.loadProvincesGeoJSON()
      const provIndex = vizManager.getProvinceIndex()
      if (provIndex) {
        setProvinceIndex(provIndex as unknown as Record<string, unknown>)
        return provIndex
      }
    }
    return provinceIndex
  }

  const loadDistrictData = async (vizManager: VisualizationManager) => {
    if (!districtsGeoJSON) {
      const geojson = await vizManager.loadDistrictsGeoJSON()
      if (geojson) {
        setDistrictsGeoJSON(geojson as unknown as Record<string, unknown>)
        const distIndex = vizManager.getDistrictIndex()
        if (distIndex) {
          setDistrictIndex(distIndex as unknown as Record<string, unknown[]>)
          return distIndex
        }
      }
    } else if (!districtIndex) {
      await vizManager.loadDistrictsGeoJSON()
      const distIndex = vizManager.getDistrictIndex()
      if (distIndex) {
        setDistrictIndex(distIndex as unknown as Record<string, unknown[]>)
        return distIndex
      }
    }
    return districtIndex
  }

  const performMatching = async (dataOverride?: Record<string, unknown>[]): Promise<MatchResults | null> => {
    const dataToUse = dataOverride || rawData

    if (!dataToUse || !map) {
      return null
    }

    setIsMatching(true)

    try {
      const vizManager = new VisualizationManager(map)

      let localProvinceIndex = provinceIndex
      let localDistrictIndex = districtIndex

      // Load GeoJSON based on location level
      if (columnMapping.locationLevel === 'province') {
        localProvinceIndex = await loadProvinceData(vizManager)
      } else if (
        columnMapping.locationLevel === 'district' ||
        columnMapping.locationLevel === 'mixed'
      ) {
        localDistrictIndex = await loadDistrictData(vizManager)

        if (columnMapping.locationLevel === 'mixed') {
          localProvinceIndex = await loadProvinceData(vizManager)
        }
      }

      // Create ColumnMapper and perform matching
      const mapper = new ColumnMapper()
      mapper.rawData = dataToUse
      mapper.columns = Object.keys(dataToUse[0])
      mapper.setColumnMapping(columnMapping)
      mapper.setIndexes(
        localProvinceIndex as unknown as Record<string, LocationInfo> | null,
        localDistrictIndex as unknown as Record<string, DistrictInfo[]> | null,
      )

      const results = mapper.matchData()
      setHasMatched(true)
      return results
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Eşleştirme hatası: ' + message)
      return null
    } finally {
      setIsMatching(false)
    }
  }

  return {
    isMatching,
    hasMatched,
    performMatching,
  }
}
