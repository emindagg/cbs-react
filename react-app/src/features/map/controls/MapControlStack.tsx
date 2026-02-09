import { useAstroStore } from '@/features/astronomy'
import BasemapSwitcher from '@/features/basemap/components/BasemapSwitcher'
import { useMediaQuery } from '@/hooks/useMediaQuery'

import { ZoomControls } from './ZoomControls'


interface MapControlStackProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

/**
 * MapControlStack Component
 * Vertical control stack: sidebar toggle, zoom, basemap, astronomy
 */
export function MapControlStack({ isSidebarOpen, onToggleSidebar }: MapControlStackProps) {
  const { isEnabled, setIsEnabled } = useAstroStore()
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
        className="w-9 h-9 bg-[#1c1c1e] rounded-full shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-sm hover:bg-black/90 active:scale-95 transition-all cursor-pointer"
        title="Kontrol panelini aç/kapat"
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      {!hideControls && (
        <>
          {/* Zoom Controls */}
          <ZoomControls />

          {/* Basemap Switcher */}
          <BasemapSwitcher />

          {/* Astronomy Toggle */}
          <button
            id="toggle-astro-button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`w-9 h-9 bg-[#1c1c1e] rounded-full shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-sm hover:bg-black/90 active:scale-95 transition-all cursor-pointer ${isEnabled ? 'ring-2 ring-emerald-400' : ''}`}
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
