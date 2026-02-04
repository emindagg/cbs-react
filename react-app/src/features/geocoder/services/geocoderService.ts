/**
 * Geocoder Service
 * HGM Atlas API integration for place search
 */

import type { Map } from 'maplibre-gl'
import maplibregl from 'maplibre-gl'

import type { AtlasGeocoderSDK } from '../types/atlasGeocoder'

export interface GeocoderResult {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'Polygon' | 'MultiPolygon';
    coordinates: [number, number] | [number, number][] | [number, number][][] | [number, number][][][];
  };
  properties: {
    name?: string;
    place_name?: string;
    text?: string;
    locality?: string; // Mahalle/semt
    county?: string; // İlçe
    region?: string; // İl
    [key: string]: unknown;
  };
}

export type AtlasFeature = GeocoderResult

export interface GeocoderResponse {
  type: 'FeatureCollection';
  features: GeocoderResult[];
}

interface SearchOptions {
  query: string;
  lng?: number;
  lat?: number;
}

interface ReverseOptions {
  lng: number;
  lat: number;
  type?: number; // 0: ALL, 1: LOCALITY, 2: COUNTY, 3: REGION
}

/**
 * Declare window.Geocoder from vanilla library
 */
declare global {
  interface Window {
    Geocoder: new (baseUrl: string) => AtlasGeocoderSDK;
  }
}

/**
 * HGM Atlas Geocoder API Client (using vanilla library)
 */
class AtlasGeocoder {
  private geocoder: AtlasGeocoderSDK

  constructor(baseUrl: string) {
    if (typeof window.Geocoder === 'undefined') {
      throw new Error('Geocoder library not loaded')
    }
    this.geocoder = new window.Geocoder(baseUrl)
  }

  /**
   * Search for a location
   */
  async search(options: SearchOptions): Promise<GeocoderResponse> {
    const { query, lng, lat } = options

    if (!query || query.trim() === '') {
      throw new Error('Lütfen bir arama terimi girin')
    }

    return new Promise((resolve, reject) => {
      this.geocoder.search({
        query: query.trim(),
        lng,
        lat,
        onload: (response: unknown, error: boolean) => {
          const geocoderResponse = response as GeocoderResponse
          if (error) {
            console.error('❌ Geocoder API error:', geocoderResponse)
            reject(new Error('Arama sırasında bir hata oluştu'))
            return
          }

          if (!geocoderResponse.features || geocoderResponse.features.length === 0) {
            reject(new Error(`"${query}" için sonuç bulunamadı`))
            return
          }

          console.log('✅ Geocoder results:', geocoderResponse)
          resolve(geocoderResponse)
        },
      })
    })
  }

  /**
   * Reverse geocoding - get location info from coordinates
   */
  async reverse(options: ReverseOptions): Promise<GeocoderResponse> {
    const { lng, lat, type = 0 } = options

    return new Promise((resolve, reject) => {
      this.geocoder.reverse({
        lng,
        lat,
        type,
        onload: (response: unknown, error: boolean) => {
          const geocoderResponse = response as GeocoderResponse
          if (error) {
            console.error('❌ Reverse geocoding error:', geocoderResponse)
            reject(new Error('Konum bilgisi alınamadı'))
            return
          }

          resolve(geocoderResponse)
        },
      })
    })
  }
}

/**
 * Geocoder Manager - manages search results on map
 */
export class GeocoderManager {
  private map: Map
  private geocoder: AtlasGeocoder
  private searchMarker: maplibregl.Marker | null = null
  private searchResultsLayer = 'search-results'

  constructor(map: Map) {
    this.map = map
    this.geocoder = new AtlasGeocoder('https://atlas.harita.gov.tr/search_yeni')
  }

  /**
   * Search for a location
   */
  async search(query: string): Promise<GeocoderResponse> {
    const center = this.map.getCenter()
    return this.geocoder.search({
      query,
      lng: center.lng,
      lat: center.lat,
    })
  }

  /**
   * Display search results on map
   */
  displayResults(results: GeocoderResponse): void {
    if (!results || !results.features || results.features.length === 0) {
      return
    }

    // Focus on first result
    const firstResult = results.features[0]
    this.focusOnResult(firstResult)

    // Mark results on map (if multiple)
    if (results.features.length > 1) {
      this.addResultsToMap(results)
    }
  }

  /**
   * Focus on a specific result
   */
  focusOnResult(feature: GeocoderResult): void {
    if (!feature || !feature.geometry) {
      return
    }

    const { geometry, properties } = feature

    if (geometry.type === 'Point') {
      const coordinates = geometry.coordinates as [number, number]

      // Fly to point
      this.map.flyTo({
        center: coordinates,
        zoom: 14,
        duration: 1500,
        essential: true,
      })

      // Add marker
      this.addSearchMarker(coordinates, properties)
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      // Fit to polygon bounds
      const bounds = this.getBounds(geometry)
      if (bounds) {
        this.map.fitBounds(bounds, {
          padding: 50,
          duration: 1500,
          essential: true,
        })
      }
    }
  }

  /**
   * Add search marker
   */
  private addSearchMarker(coordinates: [number, number], properties: Record<string, unknown>): void {
    // Remove old marker
    this.removeSearchMarker()

    // Create modern marker element
    const el = document.createElement('div')
    el.className = 'search-marker'
    el.innerHTML = `
      <svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#shadow)">
          <!-- Pin shape -->
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24c0-7.732-6.268-14-14-14z"
                fill="#3B82F6"/>
          <!-- Inner circle -->
          <circle cx="14" cy="14" r="6" fill="white"/>
          <!-- Center dot -->
          <circle cx="14" cy="14" r="3" fill="#3B82F6"/>
        </g>
        <defs>
          <filter id="shadow" x="-2" y="-2" width="32" height="42">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
      </svg>
    `
    el.style.cursor = 'pointer'

    // Popup content - compact and modern
    const placeName = properties.name || properties.place_name || 'Seçili konum'
    const address = this.formatAddress(properties)

    const popupHTML = `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 13px;
        line-height: 1.4;
        min-width: 120px;
        max-width: 220px;
      ">
        <div style="
          font-weight: 600;
          color: #1f2937;
          margin-bottom: ${address ? '4px' : '0'};
        ">${placeName}</div>
        ${address ? `
          <div style="
            font-size: 11px;
            color: #6b7280;
          ">${address}</div>
        ` : ''}
      </div>
    `

    // Create MapLibre marker
    this.searchMarker = new maplibregl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(coordinates)
      .setPopup(
        new maplibregl.Popup({
          offset: [0, -42],
          closeButton: false,
          closeOnClick: false,
          className: 'geocoder-marker-popup',
          maxWidth: '280px',
        }).setHTML(popupHTML),
      )
      .addTo(this.map)

    // Auto-open popup
    this.searchMarker.togglePopup()
  }

  /**
   * Remove search marker
   */
  removeSearchMarker(): void {
    if (this.searchMarker) {
      this.searchMarker.remove()
      this.searchMarker = null
    }
  }

  /**
   * Add all results to map
   */
  private addResultsToMap(results: GeocoderResponse): void {
    // Update or add source
    const source = this.map.getSource(this.searchResultsLayer) as maplibregl.GeoJSONSource
    if (source) {
      source.setData(results as unknown as GeoJSON.FeatureCollection)
    } else {
      this.map.addSource(this.searchResultsLayer, {
        type: 'geojson',
        data: results as unknown as GeoJSON.FeatureCollection,
      })

      // Add layer
      this.map.addLayer({
        id: this.searchResultsLayer,
        type: 'circle',
        source: this.searchResultsLayer,
        paint: {
          'circle-radius': 6,
          'circle-color': '#3b82f6',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
    }
  }

  /**
   * Clear search results
   */
  clearResults(): void {
    this.removeSearchMarker()

    if (this.map.getLayer(this.searchResultsLayer)) {
      this.map.removeLayer(this.searchResultsLayer)
    }

    if (this.map.getSource(this.searchResultsLayer)) {
      this.map.removeSource(this.searchResultsLayer)
    }
  }

  /**
   * Get bounds of geometry
   */
  private getBounds(geometry: GeocoderResult['geometry']): [[number, number], [number, number]] | null {
    let coords: number[][] = []

    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates as number[]
      return [[lng, lat], [lng, lat]]
    } else if (geometry.type === 'Polygon') {
      coords = (geometry.coordinates as number[][][])[0]
    } else if (geometry.type === 'MultiPolygon') {
      const multiCoords = geometry.coordinates as unknown as number[][][][]
      multiCoords.forEach(polygon => {
        coords = coords.concat(polygon[0])
      })
    }

    if (coords.length === 0) return null

    const lngs = coords.map(c => c[0])
    const lats = coords.map(c => c[1])

    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ]
  }

  /**
   * Format address from properties
   */
  formatAddress(properties: Record<string, unknown>): string {
    const parts: string[] = []

    // Atlas API fields
    if (properties.locality && String(properties.locality) !== String(properties.name)) {
      parts.push(String(properties.locality))
    }

    if (properties.county && String(properties.county) !== String(properties.name)) {
      parts.push(String(properties.county))
    }

    if (properties.region && String(properties.region) !== String(properties.name)) {
      parts.push(String(properties.region))
    }

    return parts.filter((p) => p).join(', ')
  }

  /**
   * Reverse geocoding
   */
  async reverse(lng: number, lat: number): Promise<GeocoderResponse> {
    return this.geocoder.reverse({ lng, lat, type: 0 })
  }
}

/**
 * Standalone search function
 */
export async function searchLocation(query: string, map?: Map): Promise<GeocoderResponse> {
  const geocoder = new AtlasGeocoder('https://atlas.harita.gov.tr/search_yeni')

  // Use map center if available, otherwise use Turkey center
  const center = map
    ? map.getCenter()
    : { lng: 35.2433, lat: 38.9637 }

  return geocoder.search({
    query,
    lng: center.lng,
    lat: center.lat,
  })
}
