/**
 * Visualization Manager
 * Handles GeoJSON loading and map visualization rendering
 */

import type { Map } from 'maplibre-gl'

import type {
  DistrictInfo,
  GeoJSONFeatureCollection,
  LocationInfo,
} from '../types/geojson'
import type { ClassificationMethod, VisualizationSettings } from '../types/visualization'
import { suggestClassificationMethod } from '../utils/classificationMethods'
import { normalizeTurkishText } from '../utils/turkishNormalizer'
import { ChoroplethRenderer } from './renderers/ChoroplethRenderer'

export class VisualizationManager {
  private map: Map
  private choroplethRenderer: ChoroplethRenderer

  // Cached GeoJSON data
  private provincesGeoJSON: GeoJSONFeatureCollection | null = null
  private districtsGeoJSON: GeoJSONFeatureCollection | null = null

  // Province and district indexes
  private provinceIndex: Record<string, LocationInfo> | null = null
  private districtIndex: Record<string, DistrictInfo[]> | null = null

  constructor(map: Map) {
    this.map = map
    this.choroplethRenderer = new ChoroplethRenderer(map)
  }

  /**
   * Load province GeoJSON (81 provinces)
   */
  async loadProvincesGeoJSON(): Promise<GeoJSONFeatureCollection | null> {
    if (this.provincesGeoJSON) return this.provincesGeoJSON

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/emindagg/turkiye_json/main/turkiye.geojson',
      )
      this.provincesGeoJSON = await response.json()
      console.debug('✅ Province GeoJSON loaded:', this.provincesGeoJSON.features.length, 'provinces')

      // Build province index
      this.buildProvinceIndex()

      return this.provincesGeoJSON
    } catch (error) {
      console.error('❌ Failed to load province GeoJSON:', error)
      return null
    }
  }

  /**
   * Load district GeoJSON (973 districts)
   */
  async loadDistrictsGeoJSON(): Promise<GeoJSONFeatureCollection | null> {
    if (this.districtsGeoJSON) return this.districtsGeoJSON

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/emindagg/turkiye_json/main/Hgk_ilce_FeaturesToJSON.geojson',
      )
      this.districtsGeoJSON = await response.json()
      console.debug('✅ District GeoJSON loaded:', this.districtsGeoJSON.features.length, 'districts')

      // Build district index
      this.buildDistrictIndex()

      return this.districtsGeoJSON
    } catch (error) {
      console.error('❌ Failed to load district GeoJSON:', error)
      return null
    }
  }

  /**
   * Build province index for column mapping
   */
  private buildProvinceIndex() {
    if (!this.provincesGeoJSON || !this.provincesGeoJSON.features) return

    const index: Record<string, LocationInfo> = {}
    this.provinceIndex = index

    this.provincesGeoJSON.features.forEach((feature) => {
      const props = feature.properties

      // HGK format prioritizes ILAD property
      const provinceName =
        props.ILAD ||
        props.name ||
        props.NAME ||
        props.il_adi ||
        props.IL_ADI ||
        props.adm1_tr ||
        props.adm1_en ||
        props.province ||
        props.PROVINCE

      if (provinceName) {
        const normalized = normalizeTurkishText(String(provinceName))

        index[normalized] = {
          name: String(provinceName),
          properties: props,
          geometry: feature.geometry,
        }
      }
    })

    console.debug('✅ Province index built:', Object.keys(index).length, 'provinces')

    if (Object.keys(index).length === 0) {
      console.error('❌ Province index is empty! Check GeoJSON property names.')
    }
  }

  /**
   * Build district index for column mapping
   */
  private buildDistrictIndex() {
    if (!this.districtsGeoJSON || !this.districtsGeoJSON.features) return

    const index: Record<string, DistrictInfo[]> = {}
    this.districtIndex = index

    this.districtsGeoJSON.features.forEach((feature) => {
      const props = feature.properties

      // HGK format prioritizes ILCEAD and ILAD properties
      const districtName =
        props.ILCEAD ||
        props.ILCE_ADI ||
        props.ilce_adi ||
        props.ilce ||
        props.name ||
        props.NAME ||
        props.ILCE ||
        props.district
      const provinceName =
        props.ILAD || props.IL_ADI || props.il_adi || props.il || props.province || props.PROVINCE || props.IL

      if (districtName) {
        const normalized = normalizeTurkishText(String(districtName))

        if (!index[normalized]) {
          index[normalized] = []
        }

        // Create composite key (province + district)
        const provinceNormalized = provinceName ? normalizeTurkishText(String(provinceName)) : ''
        const compositeKey = provinceNormalized ? `${provinceNormalized}_${normalized}` : normalized

        index[normalized].push({
          name: String(districtName),
          province: provinceName ? String(provinceName) : 'Bilinmiyor',
          compositeKey: compositeKey,
          properties: props,
          geometry: feature.geometry,
        })
      }
    })

    console.debug('✅ District index built:', Object.keys(index).length, 'unique district names')

    if (Object.keys(index).length === 0) {
      console.error('❌ District index is empty! Check GeoJSON property names.')
    }
  }

  /**
   * Get province index
   */
  getProvinceIndex(): Record<string, LocationInfo> | null {
    return this.provinceIndex
  }

  /**
   * Get district index
   */
  getDistrictIndex(): Record<string, DistrictInfo[]> | null {
    return this.districtIndex
  }

  /**
   * Render choropleth map
   */
  async renderChoropleth(
    userData: Record<string, unknown>[],
    dataColumn: string,
    settings: VisualizationSettings,
    locationLevel: 'province' | 'district' = 'province',
  ): Promise<void> {
    console.debug('Rendering choropleth map:', { userData, dataColumn, settings, locationLevel })

    // Load appropriate GeoJSON
    const geojson =
      locationLevel === 'province'
        ? await this.loadProvincesGeoJSON()
        : await this.loadDistrictsGeoJSON()

    if (!geojson) {
      console.error('❌ GeoJSON data not loaded')
      return
    }

    // Render using ChoroplethRenderer
    await this.choroplethRenderer.render(geojson, userData, dataColumn, settings, locationLevel)
  }

  /**
   * Clear visualization
   */
  clearVisualization(): void {
    // Remove layers
    if (this.map.getLayer('choropleth-fill')) {
      this.map.removeLayer('choropleth-fill')
    }
    if (this.map.getLayer('choropleth-outline')) {
      this.map.removeLayer('choropleth-outline')
    }
    if (this.map.getLayer('bubble-circles')) {
      this.map.removeLayer('bubble-circles')
    }
    if (this.map.getLayer('dot-density-points')) {
      this.map.removeLayer('dot-density-points')
    }

    // Remove sources
    if (this.map.getSource('choropleth-source')) {
      this.map.removeSource('choropleth-source')
    }
    if (this.map.getSource('bubble-source')) {
      this.map.removeSource('bubble-source')
    }
    if (this.map.getSource('dot-density-source')) {
      this.map.removeSource('dot-density-source')
    }
  }

  /**
   * Suggest classification method based on data
   */
  suggestMethod(values: number[]): { method: ClassificationMethod; reason: string } {
    return suggestClassificationMethod(values)
  }
}
