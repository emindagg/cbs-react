import { useEffect, useRef } from 'react'

import { useMapStore } from '@/stores/useMapStore'

import { updateAstroData } from './useAstroData'
import { cleanupAstroLayers, setupAstroLayers } from './useAstroLayers'
import { useAstroStore } from '../stores/useAstroStore'

export function useAstroMap() {
  const map = useMapStore(state => state.mapInstance)
  const { isEnabled, currentDate, features, isPlaying, speed, setCurrentDate } = useAstroStore()
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)

  // Initialize Sources and Layers
  useEffect(() => {
    if (!map || !isEnabled) {
      return
    }

    const setupLayers = () => {
      setupAstroLayers(map)
    }

    if (map.isStyleLoaded()) {
      setupLayers()
    } else {
      map.once('style.load', setupLayers)
    }

    return () => {
      cleanupAstroLayers(map)
    }
  }, [map, isEnabled])

  // Update Visibility
  useEffect(() => {
    if (!map || !isEnabled) return

    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
      }
    }

    setVisibility('astro-sun-marker', features.sunPosition)
    setVisibility('astro-night-shadow', features.terminator)
    setVisibility('astro-terminator-line', features.terminator)
    setVisibility('astro-moon-marker', features.moonPhase)
    setVisibility('astro-moon-label', features.moonPhase)
    setVisibility('astro-axial-line', features.axialTilt)
    setVisibility('astro-axial-label', features.axialTilt)
  }, [map, isEnabled, features])

  // Update Data
  useEffect(() => {
    if (!map || !isEnabled) return
    updateAstroData(map, currentDate)
  }, [map, isEnabled, currentDate])

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || !isEnabled) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      return
    }

    // Initialize lastUpdateRef on first play
    if (lastUpdateRef.current === 0) {
      lastUpdateRef.current = Date.now()
    }

    const animate = () => {
      const now = Date.now()
      const delta = now - lastUpdateRef.current
      lastUpdateRef.current = now

      const timeStep = delta * speed * 60

      setCurrentDate(new Date(currentDate.getTime() + timeStep))
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isPlaying, isEnabled, speed, currentDate, setCurrentDate])

  return null
}
