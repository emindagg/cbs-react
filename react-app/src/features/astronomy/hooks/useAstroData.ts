/**
 * Astronomy Data Updates
 * Separated data update logic for useAstroMap
 */

import type maplibregl from 'maplibre-gl'

import { computeTerminator, getSunDeclination, getSunHourAngle, getMoonPosition } from '../utils/astroUtils'

export function updateAstroData(map: maplibregl.Map, currentDate: Date): void {
  // Update Terminator
  const terminatorSource = map.getSource('astro-terminator') as maplibregl.GeoJSONSource
  if (terminatorSource) {
    const data = computeTerminator(currentDate)
    terminatorSource.setData({
      type: 'FeatureCollection',
      features: [data.line, data.nightPolygon],
    })
  }

  // Update Sun
  const sunSource = map.getSource('astro-sun-position') as maplibregl.GeoJSONSource
  if (sunSource) {
    const lat = getSunDeclination(currentDate)
    const lon = getSunHourAngle(currentDate)
    sunSource.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: { name: 'Güneş' },
      }],
    })
  }

  // Update Moon
  const moonSource = map.getSource('astro-moon-position') as maplibregl.GeoJSONSource
  if (moonSource) {
    const moonData = getMoonPosition(currentDate)
    const phase = moonData.illumination.phase
    let phaseName = 'Ay'
    if (phase < 0.05 || phase > 0.95) phaseName = 'Yeni Ay'
    else if (phase < 0.2) phaseName = 'Hilal (Büyüyen)'
    else if (phase < 0.3) phaseName = 'İlk Dördün'
    else if (phase < 0.45) phaseName = 'Şişkin Ay (Büyüyen)'
    else if (phase < 0.55) phaseName = 'Dolunay'
    else if (phase < 0.7) phaseName = 'Şişkin Ay (Küçülen)'
    else if (phase < 0.8) phaseName = 'Son Dördün'
    else phaseName = 'Hilal (Küçülen)'

    moonSource.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [moonData.lon, moonData.lat] },
        properties: {
          name: 'Ay',
          phase: phase,
          phaseName: phaseName,
        },
      }],
    })
  }
}
