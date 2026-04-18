import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'

import { useMapStore } from '@/stores/useMapStore'

import { updateAstroData } from './useAstroData'
import { useAstroInteraction } from './useAstroInteraction'
import { cleanupAstroLayers, setupAstroLayers } from './useAstroLayers'
import { useAstroStore } from '../stores/useAstroStore'
import { getMoonPhaseAngle, getMoonPosition, getSunMarkerData } from '../utils/astroUtils'
import { buildMoonPhaseSvgMarkup, getMoonIlluminationPercent, getMoonPhaseName } from '../utils/moonPhaseVisual'
import { buildSunMarkerSvgMarkup } from '../utils/sunVisual'

const MOON_MARKER_SIZE = '28px'
const MOON_MARKER_HOVER_SCALE = 'scale(1.1)'
const MOON_MARKER_NORMAL_SCALE = 'scale(1)'
const MOON_POPUP_OFFSET = 24
const MOON_COORD_FRACTION_DIGITS = 2
const SUN_MARKER_SIZE = '28px'
const SUN_MARKER_HOVER_SCALE = 'scale(1.1)'
const SUN_MARKER_NORMAL_SCALE = 'scale(1)'
const SUN_POPUP_OFFSET = 24
const SUN_MARKER_TITLE = 'Güneş Bilgisi'
const INTERACTIVE_MARKER_CLASSNAME = 'astro-interactive-marker'

export function useAstroMap() {
  const map = useMapStore(state => state.mapInstance)
  const isGlobeMode = useMapStore(state => state.isGlobeMode)
  const { isEnabled, currentDate, moonPhaseAngle, features, isPlaying, speed, setCurrentDate, setMoonPhaseAngle } = useAstroStore()
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const currentDateRef = useRef<Date>(currentDate)
  const speedRef = useRef<number>(speed)
  const moonMarkerRef = useRef<maplibregl.Marker | null>(null)
  const moonMarkerElementRef = useRef<HTMLDivElement | null>(null)
  const moonPopupRef = useRef<maplibregl.Popup | null>(null)
  const sunMarkerRef = useRef<maplibregl.Marker | null>(null)
  const sunMarkerElementRef = useRef<HTMLDivElement | null>(null)
  const sunPopupRef = useRef<maplibregl.Popup | null>(null)

  useAstroInteraction({
    map,
    isEnabled,
    isEclipseEnabled: features.eclipses,
    currentDate,
  })

  useEffect(() => {
    currentDateRef.current = currentDate
  }, [currentDate])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    setMoonPhaseAngle(getMoonPhaseAngle(currentDate))
  }, [currentDate, setMoonPhaseAngle])

  useEffect(() => {
    if (!map || !isEnabled || !features.sunPosition) {
      sunMarkerRef.current?.remove()
      sunMarkerRef.current = null
      sunMarkerElementRef.current = null
      sunPopupRef.current?.remove()
      sunPopupRef.current = null
      return
    }

    const sunData = getSunMarkerData(currentDate)
    const sunSvgMarkup = buildSunMarkerSvgMarkup()

    if (!sunMarkerRef.current) {
      const element = document.createElement('div')
      element.className = INTERACTIVE_MARKER_CLASSNAME
      element.style.width = SUN_MARKER_SIZE
      element.style.height = SUN_MARKER_SIZE
      element.style.pointerEvents = 'auto'
      element.style.cursor = 'pointer'
      sunMarkerElementRef.current = element
      sunMarkerRef.current = new maplibregl.Marker({
        element,
        anchor: 'center',
      })
    }

    if (sunMarkerElementRef.current) {
      sunMarkerElementRef.current.innerHTML = sunSvgMarkup
      const sunSvg = sunMarkerElementRef.current.querySelector('svg') as SVGElement | null
      if (sunSvg) {
        sunSvg.style.transition = 'transform 120ms ease'
        sunSvg.style.transformOrigin = '50% 50%'
        sunSvg.style.transformBox = 'fill-box'
        sunSvg.style.transform = SUN_MARKER_NORMAL_SCALE
      }

      sunMarkerElementRef.current.onmouseenter = () => {
        const hoverSvg = sunMarkerElementRef.current?.querySelector('svg') as SVGElement | null
        if (hoverSvg) {
          hoverSvg.style.transform = SUN_MARKER_HOVER_SCALE
        }
        map.getCanvas().style.cursor = 'pointer'
      }

      sunMarkerElementRef.current.onmouseleave = () => {
        const leaveSvg = sunMarkerElementRef.current?.querySelector('svg') as SVGElement | null
        if (leaveSvg) {
          leaveSvg.style.transform = SUN_MARKER_NORMAL_SCALE
        }
        map.getCanvas().style.cursor = ''
      }

      sunMarkerElementRef.current.onclick = (event) => {
        event.stopPropagation()

        if (!sunPopupRef.current) {
          sunPopupRef.current = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            offset: [0, -SUN_POPUP_OFFSET],
            maxWidth: '280px',
            className: 'astro-sun-popup',
          })
        }

        sunPopupRef.current
          .setLngLat([sunData.lon, sunData.lat])
          .setHTML(
            '<div style="font-family:Outfit,ui-sans-serif,system-ui;padding:2px 0;color:#0f172a">' +
            `<div style="font-size:12px;font-weight:700;letter-spacing:.01em">${SUN_MARKER_TITLE}</div>` +
            '<div style="margin-top:6px;border-top:1px solid #e2e8f0;padding-top:6px;font-size:11px;line-height:1.45">' +
            `<div><strong>Güneş Yüksekliği:</strong> ${sunData.altitude}</div>` +
            `<div><strong>Yönü (Azimuth):</strong> ${sunData.azimuth}</div>` +
            '<div style="margin-top:4px">' +
            '<strong>Gün Doğumu:</strong> ' +
            `<span style="font-size:11px;font-weight:700;margin-left:4px">${sunData.sunriseLocal}</span>` +
            `<span style="font-size:10px;color:#64748b;margin-left:6px">(${sunData.sunriseUtc})</span>` +
            '</div>' +
            '<div style="margin-top:2px">' +
            '<strong>Gün Batımı:</strong> ' +
            `<span style="font-size:11px;font-weight:700;margin-left:4px">${sunData.sunsetLocal}</span>` +
            `<span style="font-size:10px;color:#64748b;margin-left:6px">(${sunData.sunsetUtc})</span>` +
            '</div>' +
            `<div><strong>Konum:</strong> ${sunData.latText}, ${sunData.lonText}</div>` +
            '</div></div>',
          )
          .addTo(map)
      }
    }

    sunMarkerRef.current
      .setLngLat([sunData.lon, sunData.lat])
      .addTo(map)

    return () => {
      if (!features.sunPosition) {
        sunMarkerRef.current?.remove()
        sunMarkerRef.current = null
        if (sunMarkerElementRef.current) {
          sunMarkerElementRef.current.onclick = null
          sunMarkerElementRef.current.onmouseenter = null
          sunMarkerElementRef.current.onmouseleave = null
        }
        sunMarkerElementRef.current = null
        sunPopupRef.current?.remove()
        sunPopupRef.current = null
      }
    }
  }, [map, isEnabled, features.sunPosition, currentDate])

  useEffect(() => {
    if (!map || !isEnabled || !features.moonPhase) {
      moonMarkerRef.current?.remove()
      moonMarkerRef.current = null
      moonMarkerElementRef.current = null
      moonPopupRef.current?.remove()
      moonPopupRef.current = null
      return
    }

    const moonData = getMoonPosition(currentDate)
    const phaseName = getMoonPhaseName(moonPhaseAngle)
    const illuminationPercent = getMoonIlluminationPercent(moonPhaseAngle)
    const lon = moonData.lon.toFixed(MOON_COORD_FRACTION_DIGITS)
    const lat = moonData.lat.toFixed(MOON_COORD_FRACTION_DIGITS)

    if (!moonMarkerRef.current) {
      const element = document.createElement('div')
      element.className = INTERACTIVE_MARKER_CLASSNAME
      element.style.width = MOON_MARKER_SIZE
      element.style.height = MOON_MARKER_SIZE
      element.style.pointerEvents = 'auto'
      element.style.cursor = 'pointer'
      moonMarkerElementRef.current = element
      moonMarkerRef.current = new maplibregl.Marker({
        element,
        anchor: 'center',
      })
    }

    if (moonMarkerElementRef.current) {
      moonMarkerElementRef.current.innerHTML = buildMoonPhaseSvgMarkup(moonPhaseAngle)
      const moonSvg = moonMarkerElementRef.current.querySelector('svg') as SVGElement | null
      if (moonSvg) {
        moonSvg.style.transition = 'transform 120ms ease'
        moonSvg.style.transformOrigin = '50% 50%'
        moonSvg.style.transformBox = 'fill-box'
        moonSvg.style.transform = MOON_MARKER_NORMAL_SCALE
      }
      moonMarkerElementRef.current.onmouseenter = () => {
        const hoverSvg = moonMarkerElementRef.current?.querySelector('svg') as SVGElement | null
        if (hoverSvg) {
          hoverSvg.style.transform = MOON_MARKER_HOVER_SCALE
        }
        map.getCanvas().style.cursor = 'pointer'
      }
      moonMarkerElementRef.current.onmouseleave = () => {
        const leaveSvg = moonMarkerElementRef.current?.querySelector('svg') as SVGElement | null
        if (leaveSvg) {
          leaveSvg.style.transform = MOON_MARKER_NORMAL_SCALE
        }
        map.getCanvas().style.cursor = ''
      }
      moonMarkerElementRef.current.onclick = (event) => {
        event.stopPropagation()

        if (!moonPopupRef.current) {
          moonPopupRef.current = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            offset: [0, -MOON_POPUP_OFFSET],
            maxWidth: '260px',
            className: 'astro-moon-popup',
          })
        }

        moonPopupRef.current
          .setLngLat([moonData.lon, moonData.lat])
          .setHTML(
            '<div style="font-family:Outfit,ui-sans-serif,system-ui;padding:2px 0;color:#0f172a">' +
            '<div style="font-size:12px;font-weight:700;letter-spacing:.01em">Ay Bilgisi</div>' +
            '<div style="margin-top:6px;border-top:1px solid #e2e8f0;padding-top:6px;font-size:11px;line-height:1.45">' +
            `<div><strong>Evre:</strong> ${phaseName}</div>` +
            `<div><strong>Aydinlanma:</strong> %${illuminationPercent}</div>` +
            `<div><strong>Konum:</strong> ${lat}, ${lon}</div>` +
            '</div></div>',
          )
          .addTo(map)
      }
    }

    moonMarkerRef.current
      .setLngLat([moonData.lon, moonData.lat])
      .addTo(map)

    return () => {
      if (!features.moonPhase) {
        moonMarkerRef.current?.remove()
        moonMarkerRef.current = null
        if (moonMarkerElementRef.current) {
          moonMarkerElementRef.current.onclick = null
          moonMarkerElementRef.current.onmouseenter = null
          moonMarkerElementRef.current.onmouseleave = null
        }
        moonMarkerElementRef.current = null
        moonPopupRef.current?.remove()
        moonPopupRef.current = null
      }
    }
  }, [map, isEnabled, features.moonPhase, currentDate, moonPhaseAngle])

  // Initialize Sources and Layers + persist across style reloads (e.g. 2D/3D projection switch)
  useEffect(() => {
    if (!map || !isEnabled) {
      return
    }

    const rehydrate = () => {
      if (!map.isStyleLoaded()) return

      setupAstroLayers(map)

      const { features: liveFeatures } = useAstroStore.getState()
      updateAstroData(map, currentDateRef.current, liveFeatures.eclipses)

      const setVisibility = (layerId: string, visible: boolean) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
        }
      }
      setVisibility('astro-night-shadow', liveFeatures.terminator)
      setVisibility('astro-terminator-line', liveFeatures.terminator)
      setVisibility('astro-axial-line', liveFeatures.axialTilt)
      setVisibility('astro-axial-label', liveFeatures.axialTilt)
      setVisibility('astro-eclipse-marker', liveFeatures.eclipses)
      setVisibility('astro-eclipse-label', liveFeatures.eclipses)
    }

    const onStyleData = () => {
      if (!map.isStyleLoaded()) return
      if (map.getSource('astro-axial-tilt')) return
      rehydrate()
    }

    if (map.isStyleLoaded()) {
      rehydrate()
    } else {
      map.once('style.load', rehydrate)
    }

    map.on('styledata', onStyleData)

    return () => {
      map.off('styledata', onStyleData)
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

    setVisibility('astro-night-shadow', features.terminator)
    setVisibility('astro-terminator-line', features.terminator)
    setVisibility('astro-axial-line', features.axialTilt)
    setVisibility('astro-axial-label', features.axialTilt)
    setVisibility('astro-eclipse-marker', features.eclipses)
    setVisibility('astro-eclipse-label', features.eclipses)
  }, [map, isEnabled, features])

  // Update Data
  useEffect(() => {
    if (!map || !isEnabled) return
    updateAstroData(map, currentDate, features.eclipses)
  }, [map, isEnabled, currentDate, features.eclipses])

  // Projection change — MapLibre keeps sources but their tile buckets can end up
  // in a stale/empty state (e.g. wide polygons crossing the antimeridian).
  // Full cleanup + re-create purges bucket state reliably.
  useEffect(() => {
    if (!map || !isEnabled) return

    const refresh = () => {
      if (!map.isStyleLoaded()) return

      cleanupAstroLayers(map)
      setupAstroLayers(map)

      const { features: liveFeatures } = useAstroStore.getState()
      updateAstroData(map, currentDateRef.current, liveFeatures.eclipses)

      const setV = (id: string, v: boolean) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', v ? 'visible' : 'none')
        }
      }
      setV('astro-night-shadow', liveFeatures.terminator)
      setV('astro-terminator-line', liveFeatures.terminator)
      setV('astro-axial-line', liveFeatures.axialTilt)
      setV('astro-axial-label', liveFeatures.axialTilt)
      setV('astro-eclipse-marker', liveFeatures.eclipses)
      setV('astro-eclipse-label', liveFeatures.eclipses)
    }

    // Run after all post-setProjection movements (setZoom/setCenter) settle.
    const runWhenIdle = () => map.once('idle', refresh)
    runWhenIdle()

    return () => {
      map.off('idle', refresh)
    }
  }, [map, isEnabled, isGlobeMode])

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || !isEnabled) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      lastUpdateRef.current = 0
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

      const timeStep = delta * speedRef.current * 60
      const nextDate = new Date(currentDateRef.current.getTime() + timeStep)
      currentDateRef.current = nextDate
      setCurrentDate(nextDate)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [isPlaying, isEnabled, setCurrentDate])

  useEffect(() => () => {
    sunMarkerRef.current?.remove()
    sunMarkerRef.current = null
    sunPopupRef.current?.remove()
    sunPopupRef.current = null
    sunMarkerElementRef.current = null
    moonMarkerRef.current?.remove()
    moonMarkerRef.current = null
    moonPopupRef.current?.remove()
    moonPopupRef.current = null
    moonMarkerElementRef.current = null
  }, [])

  return null
}
