/**
 * Astronomy Layers Setup
 * Separated layer setup logic for useAstroMap
 */

import type maplibregl from 'maplibre-gl'

import { getAxialTiltLines } from '../utils/astroUtils'

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

  // Sun Position Source
  if (!map.getSource('astro-sun-position')) {
    map.addSource('astro-sun-position', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    map.addLayer({
      id: 'astro-sun-marker',
      type: 'circle',
      source: 'astro-sun-position',
      paint: {
        'circle-radius': 10,
        'circle-color': '#FFD700',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFA500',
      },
    })
  }

  // Moon Position Source
  if (!map.getSource('astro-moon-position')) {
    map.addSource('astro-moon-position', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })

    map.addLayer({
      id: 'astro-moon-marker',
      type: 'circle',
      source: 'astro-moon-position',
      paint: {
        'circle-radius': 8,
        'circle-color': '#e2e8f0',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#94a3b8',
      },
    })

    map.addLayer({
      id: 'astro-moon-label',
      type: 'symbol',
      source: 'astro-moon-position',
      layout: {
        'text-field': ['get', 'phaseName'],
        'text-size': 10,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#475569',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
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
        'line-color': '#10b981',
        'line-width': 1,
        'line-dasharray': [4, 1],
        'line-opacity': 0.6,
      },
    })

    map.addLayer({
      id: 'astro-axial-label',
      type: 'symbol',
      source: 'astro-axial-tilt',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 10,
        'text-offset': [0, 1],
        'text-anchor': 'top',
        'symbol-placement': 'line-center',
      },
      paint: {
        'text-color': '#10b981',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    })
  }
}

export function cleanupAstroLayers(map: maplibregl.Map): void {
  const layers = [
    'astro-night-shadow',
    'astro-terminator-line',
    'astro-sun-marker',
    'astro-moon-marker',
    'astro-moon-label',
    'astro-axial-line',
    'astro-axial-label',
  ]
  const sources = ['astro-terminator', 'astro-sun-position', 'astro-moon-position', 'astro-axial-tilt']

  layers.forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id)
  })
  sources.forEach(id => {
    if (map.getSource(id)) map.removeSource(id)
  })
}
