import { useRef, useCallback, useState } from 'react'

import { useMapStore } from '@/stores/useMapStore'

const SPACE_BG = '#010108'

export interface GlobeViewState {
  isGlobeMode: boolean
  toggle: () => void
  enable: () => void
  disable: () => void
}

/**
 * useGlobeView Hook
 * Manages 2D/3D globe projection switching
 * Legacy GlobeView pattern ported to React
 */
export function useGlobeView(): GlobeViewState {
  const mapInstance = useMapStore((state) => state.mapInstance)
  const setGlobeMode = useMapStore((state) => state.setGlobeMode)
  const previousZoomRef = useRef<number | null>(null)
  const [isGlobeMode, setIsGlobeMode] = useState(false)

  const enable = useCallback(() => {
    if (!mapInstance) {
      console.warn('Globe: Map instance not available')
      return
    }

    if (typeof mapInstance.setProjection !== 'function') {
      console.warn('⚠️ Globe projection not supported. MapLibre GL JS 2.0+ required.')
      return
    }

    if (isGlobeMode) return

    try {
      // Save current zoom
      previousZoomRef.current = mapInstance.getZoom()

      // Set globe projection
      mapInstance.setProjection({ type: 'globe' })

      // Space background: dark CSS on canvas + notify store for overlay
      mapInstance.getCanvas().style.background = SPACE_BG
      setGlobeMode(true)

      // Optimize for globe view
      if (mapInstance.getZoom() > 2) {
        mapInstance.setZoom(2)
      }
      mapInstance.setCenter([0, 0])

      setIsGlobeMode(true)
    } catch (error) {
      setGlobeMode(false)
      console.error('❌ Failed to enable globe:', error)
    }
  }, [mapInstance, isGlobeMode, setGlobeMode])

  const disable = useCallback(() => {
    if (!mapInstance) return

    if (typeof mapInstance.setProjection !== 'function') return

    try {
      mapInstance.setProjection({ type: 'mercator' })

      // Restore canvas background and notify store
      mapInstance.getCanvas().style.background = ''
      setGlobeMode(false)

      // Restore previous zoom or default to Turkey
      if (previousZoomRef.current !== null) {
        mapInstance.setZoom(previousZoomRef.current)
        previousZoomRef.current = null
      } else {
        mapInstance.setZoom(6)
      }
      mapInstance.setCenter([33.41, 39])

      setIsGlobeMode(false)
    } catch (error) {
      console.error('❌ Failed to disable globe:', error)
    }
  }, [mapInstance, setGlobeMode])

  const toggle = useCallback(() => {
    if (isGlobeMode) {
      disable()
    } else {
      enable()
    }
  }, [enable, disable, isGlobeMode])

  return {
    isGlobeMode,
    toggle,
    enable,
    disable,
  }
}
