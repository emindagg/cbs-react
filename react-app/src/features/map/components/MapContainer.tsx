import maplibregl from 'maplibre-gl'
import { useMemo } from 'react'
import Map, { ScaleControl, Source, Layer } from 'react-map-gl/maplibre'

import { useMapStore } from '@/stores/useMapStore'

import GISToolsControl from '../controls/GISToolsControl'
import { useBubbleTooltip } from '../hooks/useBubbleTooltip'
import DataLayer from '../layers/DataLayer'
import DistanceTool from '../tools/DistanceTool'
import DrawTool from '../tools/DrawTool'



export default function MapContainer() {
  const { setLoaded, setMapInstance, activeBasemap } = useMapStore()

  // Bubble haritası tooltip hook'u
  useBubbleTooltip()

  // HGM Atlas API Key
  const apiKey = 'ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC'

  // Define tile URLs based on selection
  const basemapSource = useMemo(() => {
    if (activeBasemap === 'NONE') return null

    // HGM Atlas API Key
    // const apiKey = 'ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC'

    const endpoints: Record<string, string> = {
      'TEMEL': `https://atlas.harita.gov.tr/webservis/harita/hgm_harita/{z}/{x}/{y}.png?apikey=${apiKey}`,
      'UYDU': `https://atlas.harita.gov.tr/webservis/ortofoto/{z}/{x}/{y}.jpg?apikey=${apiKey}`,
      'GECE': `https://atlas.harita.gov.tr/webservis/harita/hgm_gece/{z}/{x}/{y}.png?apikey=${apiKey}`,
      'SIYASI': `https://atlas.harita.gov.tr/webservis/harita/hgm_siyasi/{z}/{x}/{y}.png?apikey=${apiKey}`,
      'YUKSEKLIK': `https://atlas.harita.gov.tr/webservis/harita/hgm_yukseklik/{z}/{x}/{y}.png?apikey=${apiKey}`,
      'CARTO_LIGHT': 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      'CARTO_DARK': 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      'CARTO_VOYAGER': 'https://basemaps.cartocdn.com/voyager/{z}/{x}/{y}@2x.png',
    }

    const attributionMap: Record<string, string> = {
      'CARTO_LIGHT': '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      'CARTO_DARK': '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      'CARTO_VOYAGER': '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }

    return {
      type: 'raster',
      tiles: [endpoints[activeBasemap]],
      tileSize: 256,
      attribution: attributionMap[activeBasemap] || '© HGM - Harita Genel Müdürlüğü',
    }
  }, [activeBasemap])

  // "Empty" style for when using raster basemaps or NONE
  // We can't pass null to mapStyle, but we can pass a simple JSON style
  const mapStyleObj = useMemo(() => {
    return {
      version: 8,
      sources: {},
      layers: activeBasemap === 'NONE' ? [{
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#f8f9fa' },
      }] : [],
    }
  }, [activeBasemap])

  return (
    <Map
      mapLib={maplibregl}
      initialViewState={{
        longitude: 35.2433,
        latitude: 38.9637,
        zoom: 6,
      }}
      style={{ width: '100%', height: '100vh' }}
      mapStyle={mapStyleObj as maplibregl.StyleSpecification}
      onLoad={(e) => {
        setLoaded(true)
        setMapInstance(e.target)
      }}
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


      <ScaleControl position="bottom-right" />
      <DistanceTool />
      <DrawTool />
      <DataLayer />
      <GISToolsControl />
    </Map>
  )
}

