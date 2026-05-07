import * as turf from '@turf/turf'
import { useState, useMemo, useEffect } from 'react'

import Sidebar from '@/components/sidebar/Sidebar'
import { LAYOUT } from '@/constants/layout'
import { useAstroMap, AstroPanel, useAstroStore } from '@/features/astronomy'
import { BasemapSwitcher } from '@/features/basemap'
import { useClustering } from '@/features/clustering'
import { ImportedDataManagerFab, useLayerStyleSync } from '@/features/data-management'
import { ElevationProfilePanel, useElevationProfile } from '@/features/elevation-profile'
import { SearchContainer } from '@/features/geocoder'
import { GlobeToggleButton } from '@/features/globe-view'
import { HeatmapPanel, useHeatmap } from '@/features/heatmap'
import { InterpolationLegend, InterpolationPanel, useInterpolation } from '@/features/interpolation'
import { IsochronePanel, useIsochrone } from '@/features/isochrone'
import { LandCoverLegend, LayersPanel, useOverlayLayers } from '@/features/layers'
import { LegendContainer } from '@/features/legend'
import { MapContainer, MapControlStack, CoordinateDisplay } from '@/features/map'
import { SpatialAnalysisPanel, useSpatialAnalysis } from '@/features/spatial-analysis'
import { StorymapModal } from '@/features/storymap-modal'
import { TerrainAnalysisPanel, TerrainAspectLegend, TerrainSlopeLegend, useTerrainAnalysis } from '@/features/terrain-analysis'
import { VideoModal } from '@/features/video-modal'
import { useVideoModalStore } from '@/stores/useVideoModalStore'
import { useVisualizationLayerPersistence } from '@/features/visualization'
import { MapTitle } from '@/features/viz-wizard'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'


/**
 * AppLayout Component
 * Main application layout - orchestrates features
 * Refactored to Feature-Based Architecture
 */
export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const mapInstance = useMapStore((state) => state.mapInstance)
  const dataItems = useDataManagementStore((state) => state.items)
  const { isEnabled: isAstronomyEnabled, setIsEnabled: setAstronomyEnabled } = useAstroStore()
  const isMdUp = useMediaQuery('(min-width: 768px)')
  const { mapTitle, setMapTitle } = useVisualizationStore()

  const openVideoModal = useVideoModalStore((s) => s.open)

  useEffect(() => {
    openVideoModal()
  }, [openVideoModal])

  // Viz persistence önce kayıt olmalı: styledata anında önce viz layer'ları üste
  // çıkar, ardından overlay layer'lar (sular vb.) onların üstüne alınsın.
  useVisualizationLayerPersistence()

  const {
    isPanelOpen: isLayersPanelOpen,
    togglePanel: toggleLayersPanel,
    closePanel: closeLayersPanel,
    layers: overlayLayers,
    toggleLayer,
    setLayerOpacity,
    setLayerColor,
    errorMessage: overlayErrorMessage,
    isLandCoverLegendVisible,
  } = useOverlayLayers()

  useAstroMap()
  useClustering()
  // Sync layerStyles to MapLibre paint properties (INP optimization)
  useLayerStyleSync()

  // Heatmap feature
  const heatmap = useHeatmap()

  // Spatial analysis (Convex Hull, Voronoi)
  const spatial = useSpatialAnalysis()

  // Interpolation (IDW, Kriging)
  const interpolation = useInterpolation()

  // Isochrone accessibility analysis
  const isochrone = useIsochrone()

  // Elevation profile
  const elevationProfile = useElevationProfile()

  // Terrain analysis (aspect)
  const terrainAnalysis = useTerrainAnalysis()
  const terrainPolygons = useMemo(() => (
    dataItems
      .filter((item) => item.visible && (item.geometry.type === 'Polygon' || item.geometry.type === 'MultiPolygon'))
      .map((item) => ({
        id: item.id,
        name: item.name,
        geometry: item.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        areaKm2: Math.round((turf.area({ type: 'Feature', geometry: item.geometry, properties: {} }) / 1_000_000) * 100) / 100,
      }))
  ), [dataItems])

  // Toggle sidebar and resize map
  const toggleSidebar = () => {
    const nextOpen = !isSidebarOpen
    setSidebarOpen(nextOpen)
    window.localStorage.setItem('sidebar-open', String(nextOpen))
    setTimeout(() => {
      mapInstance?.resize?.()
    }, LAYOUT.ANIMATION_DURATION)
  }

  // Dynamic left positioning for controls
  const controlsLeft = useMemo(() => (
    isSidebarOpen && isMdUp
      ? `${LAYOUT.SIDEBAR_WIDTH + LAYOUT.SIDEBAR_GAP}px`
      : `${LAYOUT.BASE_OFFSET}px`
  ), [isSidebarOpen, isMdUp])

  // Search container offset (after hamburger button)
  const searchLeft = useMemo(() => {
    const base = isSidebarOpen && isMdUp
      ? LAYOUT.SIDEBAR_WIDTH + LAYOUT.SIDEBAR_GAP
      : LAYOUT.BASE_OFFSET
    return `${base + LAYOUT.HAMBURGER_OFFSET}px`
  }, [isSidebarOpen, isMdUp])

  return (
    <div id="app-root" className="relative h-screen w-full overflow-hidden bg-zinc-50" style={{ height: '100dvh' }}>

      {/* Sidebar */}
      <aside
        id="sidebar"
        data-export-ignore="true"
        className={`
                    fixed left-0 top-0 z-1350 
                    w-full md:w-72 bg-white shadow-xl h-screen 
                    flex flex-col transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
        style={{ maxWidth: `${LAYOUT.SIDEBAR_WIDTH}px`, height: '100dvh' }}
      >
        <Sidebar />
      </aside>

      {/* Map */}
      <main id="map-main" className="h-full w-full relative z-map isolate">
        <MapContainer />
      </main>

      {/* Map Control Stack (Vertical) */}
      <div
        id="map-control-container"
        data-export-ignore="true"
        className="fixed top-3 z-1500 transition-all duration-300 ease-in-out"
        style={{ left: controlsLeft }}
      >
        <MapControlStack
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          isAstronomyEnabled={isAstronomyEnabled}
          onToggleAstronomy={() => setAstronomyEnabled(!isAstronomyEnabled)}
          basemapControl={<BasemapSwitcher />}
        />
      </div>

      {/* Search Container (Horizontal) */}
      <SearchContainer
        leftPosition={searchLeft}
        isSidebarOpen={isSidebarOpen}
        globeControl={<GlobeToggleButton />}
        onLayersClick={toggleLayersPanel}
        isLayersOpen={isLayersPanelOpen}
      />
      <LayersPanel
        isOpen={isLayersPanelOpen}
        leftPosition={searchLeft}
        layers={overlayLayers}
        onClose={closeLayersPanel}
        onToggleLayer={toggleLayer}
        onOpacityChange={setLayerOpacity}
        onColorChange={setLayerColor}
        errorMessage={overlayErrorMessage}
      />
      <LandCoverLegend isVisible={isLandCoverLegendVisible} />

      {/* Astronomy Feature */}
      <AstroPanel />

      {/* Map Title */}
      <MapTitle
        title={mapTitle.title}
        subtitle={mapTitle.subtitle}
        visible={mapTitle.visible}
        position={mapTitle.position}
        fontSize={mapTitle.fontSize}
        onTitleChange={(title) => setMapTitle({ title })}
        onSubtitleChange={(subtitle) => setMapTitle({ subtitle })}
      />

      {/* Heatmap Configuration Panel */}
      <HeatmapPanel
        isOpen={heatmap.isPanelOpen}
        config={heatmap.config}
        activePreset={heatmap.activePreset}
        numericFields={heatmap.numericFields}
        pointCount={heatmap.pointCount}
        hasData={heatmap.hasData}
        onConfigChange={heatmap.setConfig}
        onPreset={heatmap.applyPreset}
        onClose={() => heatmap.setPanelOpen(false)}
        onDeactivate={heatmap.deactivate}
      />

      {/* Spatial Analysis Panel */}
      <SpatialAnalysisPanel
        isOpen={spatial.isPanelOpen}
        activeAnalysis={spatial.activeAnalysis}
        convexHullStyle={spatial.convexHullStyle}
        voronoiStyle={spatial.voronoiStyle}
        nearestPointsStyle={spatial.nearestPointsStyle}
        nearestPointsConfig={spatial.nearestPointsConfig}
        nearestStats={spatial.nearestStats}
        pointCount={spatial.pointCount}
        hasData={spatial.hasData}
        onConvexHullStyleChange={spatial.setConvexHullStyle}
        onVoronoiStyleChange={spatial.setVoronoiStyle}
        onNearestPointsStyleChange={spatial.setNearestPointsStyle}
        onNearestPointsConfigChange={spatial.setNearestPointsConfig}
        onClose={() => spatial.setPanelOpen(false)}
        onDeactivate={spatial.deactivate}
      />

      {/* Interpolation Panel */}
      <InterpolationPanel
        isActive={interpolation.isActive}
        isPanelOpen={interpolation.isPanelOpen}
        config={interpolation.config}
        isProcessing={interpolation.isProcessing}
        error={interpolation.error}
        numericColumns={interpolation.numericColumns}
        pointCount={interpolation.pointCount}
        hasData={interpolation.hasData}
        setConfig={interpolation.setConfig}
        setPanelOpen={interpolation.setPanelOpen}
        runInterpolation={interpolation.runInterpolation}
        deactivate={interpolation.deactivate}
      />

      {/* Interpolation Legend (floating, harita üzerinde) */}
      <InterpolationLegend
        isActive={interpolation.isActive}
        result={interpolation.result}
        error={interpolation.error}
        config={interpolation.config}
        legend={interpolation.legend}
        setLegendTitle={interpolation.setLegendTitle}
        setLegendPosition={interpolation.setLegendPosition}
      />

      {/* Isochrone Panel */}
      <IsochronePanel
        isOpen={isochrone.isPanelOpen}
        mode={isochrone.mode}
        selectedTimes={isochrone.selectedTimes}
        origin={isochrone.origin}
        isochroneData={isochrone.isochroneData}
        routeStats={isochrone.routeStats}
        isLoading={isochrone.isLoading}
        isRouteLoading={isochrone.isRouteLoading}
        isAwaitingDestination={isochrone.isAwaitingDestination}
        error={isochrone.error}
        onModeChange={isochrone.setMode}
        onTimeToggle={isochrone.toggleTime}
        onStartDirections={isochrone.startDirections}
        onCancelDirections={isochrone.cancelDirections}
        onClose={() => isochrone.setPanelOpen(false)}
        onDeactivate={isochrone.deactivate}
      />

      {/* Elevation Profile Panel */}
      <ElevationProfilePanel
        isOpen={elevationProfile.isPanelOpen}
        waypointCount={elevationProfile.waypoints.length}
        elevationData={elevationProfile.elevationData}
        stats={elevationProfile.stats}
        isLoading={elevationProfile.isLoading}
        error={elevationProfile.error}
        onClose={() => elevationProfile.setPanelOpen(false)}
        onDeactivate={() => { elevationProfile.deactivate(); elevationProfile.setPanelOpen(true) }}
        onActivePoint={elevationProfile.setActivePoint}
        onRunAnalysis={() => elevationProfile.finalize(elevationProfile.waypoints)}
      />

      {/* Terrain Aspect Analysis Panel */}
      <TerrainAnalysisPanel
        isOpen={terrainAnalysis.isPanelOpen}
        isActive={terrainAnalysis.isActive}
        isLoading={terrainAnalysis.isLoading}
        error={terrainAnalysis.error}
        mode={terrainAnalysis.mode}
        selectedPoint={terrainAnalysis.selectedPoint}
        result={terrainAnalysis.result}
        polygonOptions={terrainPolygons}
        selectedPolygonId={terrainAnalysis.selectedPolygonId}
        slopeResult={terrainAnalysis.slopeResult}
        slopeOpacity={terrainAnalysis.slopeOpacity}
        aspectResult={terrainAnalysis.aspectResult}
        aspectOpacity={terrainAnalysis.aspectOpacity}
        onModeChange={terrainAnalysis.setMode}
        onSelectedPolygonChange={terrainAnalysis.setSelectedPolygonId}
        onRunSlopeAnalysis={() => {
          const polygon = terrainPolygons.find((item) => item.id === terrainAnalysis.selectedPolygonId)
          if (polygon) void terrainAnalysis.runSlopeAnalysis(polygon)
        }}
        onSlopeOpacityChange={terrainAnalysis.setSlopeOpacity}
        onRunAspectAnalysis={() => {
          const polygon = terrainPolygons.find((item) => item.id === terrainAnalysis.selectedPolygonId)
          if (polygon) void terrainAnalysis.runAspectAnalysis(polygon)
        }}
        onAspectOpacityChange={terrainAnalysis.setAspectOpacity}
        onClose={() => terrainAnalysis.setPanelOpen(false)}
        onDeactivate={terrainAnalysis.deactivate}
      />

      {/* Terrain Slope - Sürüklenebilir Lejant */}
      {terrainAnalysis.isActive && terrainAnalysis.mode === 'polygon-slope' && terrainAnalysis.slopeResult && (
        <TerrainSlopeLegend result={terrainAnalysis.slopeResult} />
      )}

      {/* Terrain Aspect - Sürüklenebilir Lejant */}
      {terrainAnalysis.isActive && terrainAnalysis.mode === 'polygon-aspect' && terrainAnalysis.aspectResult && (
        <TerrainAspectLegend result={terrainAnalysis.aspectResult} />
      )}

      {/* Visualization Legend */}
      <LegendContainer />
      <ImportedDataManagerFab />

      {/* Coordinate Display – sidebar farkındalıklı; mobilde sidebar açıkken ve yükseklik profili paneli açıkken gizle */}
      <CoordinateDisplay
        leftPosition={controlsLeft}
        hidden={(isSidebarOpen && !isMdUp) || elevationProfile.isPanelOpen || terrainAnalysis.isPanelOpen}
      />

      {/* Hikâye Haritası modal (iframe) */}
      <StorymapModal />

      {/* Eğitim Videoları modal (iframe) */}
      <VideoModal />
    </div>
  )
}
