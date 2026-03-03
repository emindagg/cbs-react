/**
 * Visualization Manager
 * Handles GeoJSON loading and map visualization rendering
 */

import type { Map } from 'maplibre-gl'

import type {
  DistrictInfo,
  GeoJSONFeatureCollection,
  LocationInfo,
} from '@/types/geojson'
import type { ClassificationMethod, VisualizationSettings } from '@/types/visualization'
import { suggestClassificationMethod } from '@/utils/dataStats'
import { getPlateCodeByName, normalizeTurkishText } from '@/utils/turkishNormalizer'

import { applyLabelLayers } from './labelLayers'
import { BubbleRenderer } from '../bubble/services/BubbleRenderer'
import { ChoroplethRenderer } from '../choropleth/services/ChoroplethRenderer'
import { PointRenderer } from '../point/services/PointRenderer'

const DEFAULT_BACKDROP_FILL_OPACITY = 1
const BACKDROP_LINE_OPACITY = 1

export class VisualizationManager {
  private map: Map
  private choroplethRenderer: ChoroplethRenderer
  private pointRenderer: PointRenderer
  private bubbleRenderer: BubbleRenderer

  // Cached GeoJSON data
  private provincesGeoJSON: GeoJSONFeatureCollection | null = null
  private districtsGeoJSON: GeoJSONFeatureCollection | null = null

  // Province and district indexes
  private provinceIndex: Record<string, LocationInfo> | null = null
  private districtIndex: Record<string, DistrictInfo[]> | null = null

  constructor(map: Map) {
    this.map = map
    this.choroplethRenderer = new ChoroplethRenderer(map)
    this.pointRenderer = new PointRenderer(map)
    this.bubbleRenderer = new BubbleRenderer(map)
  }

  /**
   * Load province GeoJSON (81 provinces)
   */
  async loadProvincesGeoJSON(): Promise<GeoJSONFeatureCollection | null> {
    if (this.provincesGeoJSON) return this.provincesGeoJSON

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/emindagg/turkiye_json/main/iller_tuik_standart.geojson',
      )
      this.provincesGeoJSON = await response.json()
      console.debug('✅ Province GeoJSON loaded:', this.provincesGeoJSON?.features?.length ?? 0, 'provinces')

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
        'https://raw.githubusercontent.com/emindagg/turkiye_json/main/ilceler_key_react.geojson',
      )
      this.districtsGeoJSON = await response.json()
      console.debug('✅ District GeoJSON loaded:', this.districtsGeoJSON?.features?.length ?? 0, 'districts')

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

      // TÜİK standart format: ADI = il adı, IL = plaka kodu
      const provinceName =
        props.ADI ||
        props.ILAD ||
        props.name ||
        props.NAME ||
        props.il_adi ||
        props.IL_ADI ||
        props.adm1_tr ||
        props.adm1_en ||
        props.province ||
        props.PROVINCE

      const plateCode = props.IL // Plaka kodu (ör: "39")

      if (provinceName) {
        const locationInfo: LocationInfo = {
          name: String(provinceName),
          properties: props,
          geometry: feature.geometry,
        }

        // İl adıyla indexle (ör: "kirklareli")
        const normalized = normalizeTurkishText(String(provinceName))
        index[normalized] = locationInfo

        // Plaka koduyla da indexle (ör: "39")
        if (plateCode) {
          const code = String(plateCode).trim()
          index[code] = locationInfo
          // Başında sıfır olmadan da ekle (ör: "01" → "1")
          const numericCode = String(parseInt(code, 10))
          if (numericCode !== code) {
            index[numericCode] = locationInfo
          }
        }
      }
    })

    console.debug('✅ Province index built:', Object.keys(index).length, 'entries (il adı + plaka kodu)')

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
      const geoKey = props.key || props.KEY // Benzersiz key (ör: "istanbul_kadikoy" veya "27_sehitkamil")
      const plaka = props.plaka ?? props.IL // Plaka kodu (ör: 34 veya "27")

      if (districtName) {
        const normalized = normalizeTurkishText(String(districtName))

        if (!index[normalized]) {
          index[normalized] = []
        }

        // Create composite key (province + district)
        const provinceNormalized = provinceName ? normalizeTurkishText(String(provinceName)) : ''
        const compositeKey = provinceNormalized ? `${provinceNormalized}_${normalized}` : normalized

        const districtInfo: DistrictInfo = {
          name: String(districtName),
          province: provinceName ? String(provinceName) : 'Bilinmiyor',
          compositeKey: compositeKey,
          properties: props,
          geometry: feature.geometry,
        }

        index[normalized].push(districtInfo)

        // Composite key ile de indexle (province_district format: "istanbul_kadikoy")
        if (compositeKey && compositeKey.includes('_') && compositeKey !== normalized) {
          if (!index[compositeKey]) {
            index[compositeKey] = []
          }
          index[compositeKey].push(districtInfo)
        }

        // GeoJSON key ile de indexle (benzersiz anahtar)
        if (geoKey) {
          const normalizedKey = normalizeTurkishText(String(geoKey))
          if (!index[normalizedKey]) {
            index[normalizedKey] = []
          }
          index[normalizedKey].push(districtInfo)
        }

        // Plaka kodu ile de indexle (örn: "27_sehitkamil")
        if (plaka !== undefined && plaka !== null) {
          const plakaStr = String(plaka).trim().padStart(2, '0')
          const plakaDistrictKey = `${plakaStr}_${normalized}`
          if (!index[plakaDistrictKey]) {
            index[plakaDistrictKey] = []
          }
          index[plakaDistrictKey].push(districtInfo)

          // Sıfırsız versiyon da ekle ("7" → "7_merkez" gibi)
          const unpadded = String(parseInt(plakaStr, 10))
          if (unpadded !== plakaStr) {
            const unpaddedKey = `${unpadded}_${normalized}`
            if (!index[unpaddedKey]) {
              index[unpaddedKey] = []
            }
            index[unpaddedKey].push(districtInfo)
          }
        }

        // İl adı bazlı compositeKey varsa, plaka bazlı versiyonunu da ekle
        // "gaziantep_sehitkamil" → "27_sehitkamil" ve tersi
        if (compositeKey && compositeKey.includes('_')) {
          const underscoreIdx = compositeKey.indexOf('_')
          const prefix = compositeKey.substring(0, underscoreIdx)
          const suffix = compositeKey.substring(underscoreIdx + 1)

          if (/^[a-z]+$/.test(prefix)) {
            // Province name → plate code version
            const plateCode = getPlateCodeByName(prefix)
            if (plateCode) {
              const plateKey = `${plateCode}_${suffix}`
              if (!index[plateKey]) index[plateKey] = []
              index[plateKey].push(districtInfo)
            }
          } else if (/^\d+$/.test(prefix)) {
            // Plate code → province name version (already done via normalizeTurkishText in compositeKey)
          }
        }
      }
    })

    console.debug('✅ District index built:', Object.keys(index).length, 'entries (ilçe adı + key + plaka)')

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
   * Render point/dot map
   */
  async renderPoint(
    userData: Record<string, unknown>[],
    dataColumn: string,
    settings: VisualizationSettings,
    locationLevel: 'province' | 'district' = 'province',
  ): Promise<void> {
    console.debug('Rendering point map:', { userData, dataColumn, settings, locationLevel })

    // Load appropriate GeoJSON
    const geojson =
      locationLevel === 'province'
        ? await this.loadProvincesGeoJSON()
        : await this.loadDistrictsGeoJSON()

    if (!geojson) {
      console.error('❌ GeoJSON data not loaded')
      return
    }

    // Render using PointRenderer
    await this.pointRenderer.render(geojson, userData, dataColumn, settings, locationLevel)
  }

  /**
   * Render bubble map
   */
  async renderBubble(
    userData: Record<string, unknown>[],
    dataColumn: string,
    settings: VisualizationSettings,
    locationLevel: 'province' | 'district' = 'province',
  ): Promise<void> {
    console.debug('Rendering bubble map:', { userData, dataColumn, settings, locationLevel })

    // Load appropriate GeoJSON
    const geojson =
      locationLevel === 'province'
        ? await this.loadProvincesGeoJSON()
        : await this.loadDistrictsGeoJSON()

    if (!geojson) {
      console.error('❌ GeoJSON data not loaded')
      return
    }

    // Render using BubbleRenderer
    await this.bubbleRenderer.render(geojson, userData, dataColumn, settings, locationLevel)
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
    if (this.map.getLayer('dot-circles')) {
      this.map.removeLayer('dot-circles')
    }
    if (this.map.getLayer('viz-backdrop-outline')) {
      this.map.removeLayer('viz-backdrop-outline')
    }
    if (this.map.getLayer('viz-backdrop-fill')) {
      this.map.removeLayer('viz-backdrop-fill')
    }

    // Remove label layers before sources
    if (this.map.getLayer('viz-name-labels')) this.map.removeLayer('viz-name-labels')
    if (this.map.getLayer('viz-value-labels')) this.map.removeLayer('viz-value-labels')
    if (this.map.getSource('viz-label-source')) this.map.removeSource('viz-label-source')

    // Remove sources
    if (this.map.getSource('choropleth-source')) {
      this.map.removeSource('choropleth-source')
    }
    if (this.map.getSource('bubble-source')) {
      this.map.removeSource('bubble-source')
    }
    if (this.map.getSource('dot-source')) {
      this.map.removeSource('dot-source')
    }
    if (this.map.getSource('viz-backdrop-source')) {
      this.map.removeSource('viz-backdrop-source')
    }
  }

  /**
   * Update label layers without full re-render.
   * Detects active source from the current map state.
   */
  updateLabels(settings: VisualizationSettings): void {
    if (!this.map.getSource('viz-label-source')) return
    applyLabelLayers(this.map, 'viz-label-source', settings)
  }

  /**
   * Update display-only toggles (showLabels, showValues, dataOnlyMode) without full re-render.
   * Updates layer filters / paint properties and refreshes label layers in-place.
   */
  updateDisplayOptions(settings: VisualizationSettings): void {
    type LayerFilter = NonNullable<Parameters<Map['setFilter']>[1]>

    const noDataColor = settings.noDataColor ?? '#e4e4e4'

    // Choropleth: update fill/outline filter, opacity, and noDataColor
    if (this.map.getLayer('choropleth-fill')) {
      const layerFilter: LayerFilter = (settings.dataOnlyMode && settings.dataOnlyStyle !== 'transparent')
        ? ['==', ['get', 'hasData'], true] as LayerFilter
        : ['any', ['==', 'hasData', true], ['==', 'hasData', false]] as LayerFilter
      this.map.setFilter('choropleth-fill', layerFilter)
      this.map.setFilter('choropleth-outline', layerFilter)

      const choroplethOpacity = settings.choroplethOpacity ?? 1
      const fillOpacity = settings.dataOnlyMode && settings.dataOnlyStyle === 'transparent'
        ? ['case', ['==', ['get', 'hasData'], false], 0, choroplethOpacity]
        : choroplethOpacity
      this.map.setPaintProperty('choropleth-fill', 'fill-opacity', fillOpacity)

      // Live noDataColor update: rebuild the outer hasData wrap with the new color
      if (this.choroplethRenderer.lastBaseColorExpression !== null) {
        const newColorExpression: unknown = [
          'case',
          ['==', ['get', 'hasData'], false],
          noDataColor,
          this.choroplethRenderer.lastBaseColorExpression,
        ]
        this.map.setPaintProperty('choropleth-fill', 'fill-color', newColorExpression)
      }
    }

    // Bubble/Point: update backdrop fill-color and opacity
    if (this.map.getLayer('viz-backdrop-fill')) {
      this.map.setPaintProperty('viz-backdrop-fill', 'fill-color', noDataColor)
      const backdropFillOpacity = settings.backdropFillOpacity ?? DEFAULT_BACKDROP_FILL_OPACITY
      const effectiveFillOpacity: unknown = settings.dataOnlyMode
        ? ['case', ['==', ['get', 'hasData'], true], backdropFillOpacity, 0]
        : backdropFillOpacity
      this.map.setPaintProperty('viz-backdrop-fill', 'fill-opacity', effectiveFillOpacity)
    }
    if (this.map.getLayer('viz-backdrop-outline')) {
      const effectiveLineOpacity: unknown = settings.dataOnlyMode
        ? ['case', ['==', ['get', 'hasData'], true], BACKDROP_LINE_OPACITY, 0]
        : BACKDROP_LINE_OPACITY
      this.map.setPaintProperty('viz-backdrop-outline', 'line-opacity', effectiveLineOpacity)
    }

    // Always refresh label layers
    this.updateLabels(settings)
  }

  /**
   * Suggest classification method based on data
   */
  suggestMethod(values: number[]): { method: ClassificationMethod; reason: string } {
    return suggestClassificationMethod(values)
  }
}
