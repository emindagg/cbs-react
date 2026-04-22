import maplibregl from 'maplibre-gl'
import { useMemo } from 'react'
import Map, { Source, Layer } from 'react-map-gl/maplibre'

import { DataManagementDrawTool } from '@/features/data-management'
import { ElevationProfileTool } from '@/features/elevation-profile'
import { useBubbleTooltip, useChoroplethTooltip } from '@/shared/visualization'
import { useMapStore } from '@/stores/useMapStore'

import { FeaturePopup } from './FeaturePopup'
import DraggableNorthArrow from '../controls/DraggableNorthArrow'
import DraggableScaleControl from '../controls/DraggableScaleControl'
import GISToolsControl from '../controls/GISToolsControl'
import { MapCompass } from '../controls/MapCompass'
import TimelineControl from '../controls/TimelineControl'
import { useFeaturePopup } from '../hooks/useFeaturePopup'
import DataLayer from '../layers/DataLayer'
import DistanceTool from '../tools/DistanceTool'



const SPACE_COLOR = '#010108'
const LARGE_MESH_VERTEX_WARNING = 'Max vertices per segment is 65535'

// Star positions: [x%, y%, size, opacity]
/* eslint-disable no-magic-numbers */
const STARS: [number, number, number, number][] = [
  [5, 8, 1.5, 0.9], [12, 22, 1, 0.7], [18, 5, 2, 0.8], [25, 40, 1, 0.6],
  [33, 15, 1.5, 0.9], [40, 65, 1, 0.7], [48, 30, 2, 1.0], [55, 80, 1, 0.6],
  [62, 10, 1.5, 0.8], [70, 55, 1, 0.7], [77, 25, 2, 0.9], [83, 70, 1, 0.6],
  [90, 45, 1.5, 0.8], [95, 88, 1, 0.7], [8, 75, 1, 0.5], [20, 90, 1.5, 0.8],
  [35, 52, 1, 0.6], [50, 12, 2, 0.9], [65, 82, 1, 0.7], [80, 38, 1.5, 0.8],
  [92, 18, 1, 0.6], [3, 48, 2, 0.7], [15, 62, 1, 0.5], [28, 78, 1.5, 0.9],
  [42, 95, 1, 0.6], [58, 42, 2, 0.8], [72, 68, 1, 0.7], [87, 92, 1.5, 0.9],
  [96, 72, 1, 0.5], [44, 20, 1, 0.8], [7, 35, 1.5, 0.7], [38, 5, 1, 0.9],
]

function SpaceBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ background: 'transparent', zIndex: 2 }}
    >
      {STARS.map(([x, y, size, opacity], i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            opacity,
            transform: 'translate(-50%, -50%)',
            boxShadow: size >= 2 ? `0 0 ${size * 2}px rgba(255,255,255,0.6)` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function MapContainer() {
  const { setLoaded, setMapInstance, activeBasemap, isGlobeMode } = useMapStore()
  const handleMapLibreError = (event: { error?: unknown }) => {
    const message =
      typeof event.error === 'string'
        ? event.error
        : event.error instanceof Error
          ? event.error.message
          : ''

    if (message.includes(LARGE_MESH_VERTEX_WARNING)) {
      event.error = undefined
    }
  }

  // Bubble haritası tooltip hook'u
  useBubbleTooltip()
  useChoroplethTooltip()

  const { popup, close, selectItem } = useFeaturePopup()

  const apiKey = import.meta.env.VITE_HGM_API_KEY

  // Define tile URLs based on selection
  const basemapSource = useMemo(() => {
    if (activeBasemap === 'NONE') return null

    const endpoints: Record<string, string> = {
      'TEMEL': `https://atlas.harita.gov.tr/webservis/harita/hgm_harita/{z}/{x}/{y}.png?apikey=${apiKey}`,
      'UYDU': `https://atlas.harita.gov.tr/webservis/ortofoto/{z}/{x}/{y}.jpg?apikey=${apiKey}`,
      'GECE': `https://atlas.harita.gov.tr/webservis/harita/hgm_gece/{z}/{x}/{y}.png?apikey=${apiKey}`,
      'SIYASI': `https://atlas.harita.gov.tr/webservis/harita/hgm_siyasi/{z}/{x}/{y}.png?apikey=${apiKey}`,
      'YUKSEKLIK': `https://atlas.harita.gov.tr/webservis/harita/hgm_yukseklik/{z}/{x}/{y}.png?apikey=${apiKey}`,
      'CARTO_LIGHT': 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      'CARTO_DARK': 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      'CARTO_VOYAGER': 'https://basemaps.cartocdn.com/voyager/{z}/{x}/{y}@2x.png',
      'ESRI_SATELLITE': 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    }

    const attributionMap: Record<string, string> = {
      'CARTO_LIGHT': '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      'CARTO_DARK': '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      'CARTO_VOYAGER': '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      'ESRI_SATELLITE': 'Tiles &copy; Esri',
    }

    return {
      type: 'raster',
      tiles: [endpoints[activeBasemap]],
      tileSize: 256,
      attribution: attributionMap[activeBasemap] || '© HGM - Harita Genel Müdürlüğü',
    }
  }, [activeBasemap, apiKey])

  // "Empty" style for when using raster basemaps or NONE
  // In globe mode, always include a dark background layer so the space shows through
  const mapStyleObj = useMemo(() => {
    const bgColor = isGlobeMode ? SPACE_COLOR : '#f8f9fa'
    const needsBg = activeBasemap === 'NONE' || isGlobeMode
    return {
      version: 8,
      projection: { type: isGlobeMode ? 'globe' : 'mercator' },
      sources: {},
      layers: needsBg ? [{
        id: 'background',
        type: 'background',
        paint: { 'background-color': bgColor },
      }] : [],
    }
  }, [activeBasemap, isGlobeMode])

  return (
    <div className="relative w-full h-screen">
      {isGlobeMode && <SpaceBackground />}
      <Map
        mapLib={maplibregl}
        attributionControl={false}
        initialViewState={{
          longitude: 35.2433,
          latitude: 38.9637,
          zoom: 6,
        }}
        style={{ width: '100%', height: '100vh', position: 'relative', zIndex: 1 }}
        mapStyle={mapStyleObj as maplibregl.StyleSpecification}
        onLoad={(e) => {
          setLoaded(true)
          setMapInstance(e.target)
          e.target.on('error', handleMapLibreError)
        }}
        onError={handleMapLibreError}
      >
        {/* Render Basemap Raster Layer if not NONE */}
        {basemapSource && (
          <Source id="basemap-source" {...(basemapSource as maplibregl.SourceSpecification)}>
            <Layer
              id="basemap-layer"
              type="raster"
              paint={{}}
            />
          </Source>
        )}


        <DistanceTool />
        <ElevationProfileTool />
        <DataManagementDrawTool />
        <DataLayer />
        <GISToolsControl />
        <TimelineControl />
        {popup && (
          <FeaturePopup popup={popup} onClose={close} onSelect={selectItem} />
        )}
      </Map>
      <DraggableScaleControl />
      <DraggableNorthArrow />
      <MapCompass />
    </div>
  )
}

