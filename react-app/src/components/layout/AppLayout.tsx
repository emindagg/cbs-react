import { useState, useMemo } from 'react'


// Feature imports
import MapContainer from '@/components/map/MapContainer'
import Sidebar from '@/components/sidebar/Sidebar'
import { LAYOUT } from '@/constants/layout'
import { useAstroMap, AstroPanel } from '@/features/astronomy'
import { useClustering } from '@/features/clustering'
import { SearchContainer } from '@/features/geocoder/components/SearchContainer'
import { LegendContainer } from '@/features/legend-dw'
import { MapControlStack } from '@/features/map'
import { MapTitle } from '@/features/viz-wizard'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

/**
 * AppLayout Component
 * Main application layout - orchestrates features
 * Refactored to Feature-Based Architecture
 */
export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const mapInstance = useMapStore((state) => state.mapInstance)
  const isMdUp = useMediaQuery('(min-width: 768px)')
  const { mapTitle, setMapTitle } = useVisualizationStore()

  // Initialize astronomy hook
  useAstroMap()
  // Initialize clustering hook
  useClustering()

  // Toggle sidebar and resize map
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen)
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
    <div className="relative h-screen w-full overflow-hidden bg-zinc-50">

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`
                    fixed left-0 top-0 z-1350 
                    w-full md:w-72 bg-white shadow-xl h-screen 
                    flex flex-col transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
        style={{ maxWidth: `${LAYOUT.SIDEBAR_WIDTH}px` }}
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
        className="fixed top-3 z-1500 transition-all duration-300 ease-in-out"
        style={{ left: controlsLeft }}
      >
        <MapControlStack
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
      </div>

      {/* Search Container (Horizontal) */}
      <SearchContainer leftPosition={searchLeft} isSidebarOpen={isSidebarOpen} />

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

      {/* Visualization Legend */}
      <LegendContainer />

    </div>
  )
}
