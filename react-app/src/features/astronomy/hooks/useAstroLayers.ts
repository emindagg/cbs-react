/**
 * Astronomy Layers Setup
 * Separated layer setup logic for useAstroMap
 */

import type maplibregl from 'maplibre-gl'

import { getAxialTiltLabels, getAxialTiltLines } from '../utils/astroUtils'

const ECLIPSE_LABEL_OFFSET_Y = 1.4

export function setupAstroLayers(map: maplibregl.Map): void {
  if (!map.getStyle()) {
    return
  }

  // Terminator Source
  if (!map.getSource('astro-terminator')) {
    map.addSource('astro-terminator', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    map.addLayer({
      id: 'astro-night-shadow',
      type: 'fill',
      source: 'astro-terminator',
      filter: ['==', ['get', 'description'], 'Gece Bölgesi'],
      paint: {
        'fill-color': '#000000',
        'fill-opacity': 0.3,
      },
    })

    map.addLayer({
      id: 'astro-terminator-line',
      type: 'line',
      source: 'astro-terminator',
      filter: ['==', ['get', 'description'], 'Gece/Gündüz Sınır Çizgisi (Terminator)'],
      paint: {
        'line-color': '#FFB700',
        'line-width': 2,
        'line-dasharray': [2, 2],
        'line-opacity': 0.8,
      },
    })
  }

  // Moon Position Source
  if (!map.getSource('astro-moon-position')) {
    map.addSource('astro-moon-position', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }

  // Axial Tilt Source
  if (!map.getSource('astro-axial-tilt')) {
    map.addSource('astro-axial-tilt', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: getAxialTiltLines(),
      },
    })

    map.addLayer({
      id: 'astro-axial-line',
      type: 'line',
      source: 'astro-axial-tilt',
      paint: {
        'line-color': '#b45309',
        'line-width': 1,
        'line-dasharray': [4, 1],
        'line-opacity': 0.6,
      },
    })
  }

  // Axial Tilt Labels (separate source with Point features — robust under globe projection)
  if (!map.getSource('astro-axial-tilt-labels')) {
    map.addSource('astro-axial-tilt-labels', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: getAxialTiltLabels(),
      },
    })

    map.addLayer({
      id: 'astro-axial-label',
      type: 'symbol',
      source: 'astro-axial-tilt-labels',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 13,
        'text-offset': [0, 0.8],
        'text-anchor': 'top',
        'text-letter-spacing': 0.05,
        'text-padding': 4,
      },
      paint: {
        'text-color': '#b45309',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2.5,
        'text-halo-blur': 0.5,
      },
    })
  }

  // Eclipse Analysis Source
  if (!map.getSource('astro-eclipse-events')) {
    map.addSource('astro-eclipse-events', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    map.addLayer({
      id: 'astro-eclipse-marker',
      type: 'circle',
      source: 'astro-eclipse-events',
      paint: {
        'circle-radius': 7,
        'circle-color': [
          'match',
          ['get', 'eventType'],
          'solar-global', '#f97316',
          'solar-local', '#ef4444',
          'lunar', '#6366f1',
          '#64748b',
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })

    map.addLayer({
      id: 'astro-eclipse-label',
      type: 'symbol',
      source: 'astro-eclipse-events',
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 10,
        'text-offset': [0, ECLIPSE_LABEL_OFFSET_Y],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#334155',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.2,
      },
    })
  }
}

export function cleanupAstroLayers(map: maplibregl.Map): void {
  const layers = [
    'astro-night-shadow',
    'astro-terminator-line',
    'astro-axial-line',
    'astro-axial-label',
    'astro-eclipse-marker',
    'astro-eclipse-label',
  ]
  const sources = ['astro-terminator', 'astro-moon-position', 'astro-axial-tilt', 'astro-axial-tilt-labels', 'astro-eclipse-events']

  layers.forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id)
  })
  sources.forEach(id => {
    if (map.getSource(id)) map.removeSource(id)
  })
}
