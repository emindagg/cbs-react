import type { ReactNode } from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'

import { GeolocationButton } from './GeolocationButton'
import { ZoomControls } from './ZoomControls'

interface MapControlStackProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  isAstronomyEnabled: boolean
  onToggleAstronomy: () => void
  basemapControl?: ReactNode
}

/**
 * MapControlStack Component
 * Vertical control stack: sidebar toggle, zoom, basemap, astronomy
 */
export function MapControlStack({
  isSidebarOpen,
  onToggleSidebar,
  isAstronomyEnabled,
  onToggleAstronomy,
  basemapControl,
}: MapControlStackProps) {
  const isMobile = !useMediaQuery('(min-width: 768px)')
  const hideControls = isMobile && isSidebarOpen

  return (
    <div className="flex flex-col border-0 box-border" style={{ gap: '0.65rem' }}>

      {/* Sidebar Toggle - her zaman görünür */}
      <button
        id="open-sidebar"
        onClick={onToggleSidebar}
        aria-controls="sidebar"
        aria-expanded={isSidebarOpen}
        className="w-9 h-9 bg-[#1c1c1e] hover:bg-[#2a2a2c] hover:text-white/70 active:bg-[#2c2c2e] rounded-[12px] shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-sm cursor-pointer"
        title="Kontrol panelini aç/kapat"
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      {!hideControls && (
        <>
          {/* Zoom Controls */}
          <ZoomControls />

          {/* Geolocation */}
          <GeolocationButton />

          {/* Basemap Switcher */}
          {basemapControl}

          {/* Astronomy Toggle */}
          <button
            id="toggle-astro-button"
            onClick={onToggleAstronomy}
            className={`w-9 h-9 bg-[#1c1c1e] hover:bg-[#2a2a2c] hover:text-white/70 active:bg-[#2c2c2e] rounded-[12px] shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-sm cursor-pointer ${isAstronomyEnabled ? 'text-emerald-400' : ''}`}
            title="Astronomi görünümlerini aç/kapat"
          >
            <i className="fa-solid fa-satellite-dish"></i>
          </button>
        </>
      )}

    </div>
  )
}

export default MapControlStack
