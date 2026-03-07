import { useEffect, useRef, useCallback } from 'react'
import { Popup } from 'maplibre-gl'
import type { MapMouseEvent } from 'maplibre-gl'

import { useMapStore } from '@/stores/useMapStore'

import { fetchIsochrones, fetchRoute } from '../services/isochroneApi'
import { IsochroneRenderer } from '../services/IsochroneRenderer'
import { RouteRenderer } from '../services/RouteRenderer'
import { useIsochroneStore } from '../stores/useIsochroneStore'

const POPUP_HTML = `
  <div style="font-family:system-ui,-apple-system,sans-serif;min-width:152px;overflow:hidden;border-radius:10px;">
    <div style="padding:7px 11px 6px;border-bottom:1px solid #f1f5f9;">
      <span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">İşlem Seç</span>
    </div>
    <div style="padding:4px 5px;">
      <button id="iso-popup-directions"
        style="display:flex;align-items:center;gap:7px;width:100%;padding:6px 8px;border:none;background:transparent;cursor:pointer;border-radius:7px;text-align:left;"
        onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='transparent'">
        <span style="width:20px;height:20px;border-radius:6px;background:#3b82f6;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </span>
        <span style="font-size:11px;font-weight:600;color:#1e40af;">Yol Tarifi Al</span>
      </button>
      <button id="iso-popup-new"
        style="display:flex;align-items:center;gap:7px;width:100%;padding:6px 8px;border:none;background:transparent;cursor:pointer;border-radius:7px;text-align:left;"
        onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='transparent'">
        <span style="width:20px;height:20px;border-radius:6px;background:#22c55e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </span>
        <span style="font-size:11px;font-weight:600;color:#15803d;">Yeni Analiz Başlat</span>
      </button>
    </div>
  </div>
`

export function useIsochrone() {
  const map = useMapStore((s) => s.mapInstance)

  const {
    isActive,
    isPanelOpen,
    mode,
    selectedTimes,
    origin,
    isochroneData,
    routeData,
    routeStats,
    isLoading,
    isRouteLoading,
    isAwaitingDestination,
    error,
    toggle,
    setMode,
    toggleTime,
    setOrigin,
    setIsochroneData,
    setRouteData,
    setRouteStats,
    setLoading,
    setRouteLoading,
    setAwaitingDestination,
    setError,
    setPanelOpen,
    reset,
  } = useIsochroneStore()

  const isoRendererRef = useRef<IsochroneRenderer | null>(null)
  const routeRendererRef = useRef<RouteRenderer | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const isoAbortRef = useRef<AbortController | null>(null)
  const routeAbortRef = useRef<AbortController | null>(null)
  const isAwaitingRef = useRef(false)

  const modeRef = useRef(mode)
  const selectedTimesRef = useRef(selectedTimes)
  const originRef = useRef(origin)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { selectedTimesRef.current = selectedTimes }, [selectedTimes])
  useEffect(() => { originRef.current = origin }, [origin])
  useEffect(() => { isAwaitingRef.current = isAwaitingDestination }, [isAwaitingDestination])

  const getIsoRenderer = useCallback((): IsochroneRenderer | null => {
    if (!map) return null
    if (!isoRendererRef.current) isoRendererRef.current = new IsochroneRenderer(map)
    return isoRendererRef.current
  }, [map])

  const getRouteRenderer = useCallback((): RouteRenderer | null => {
    if (!map) return null
    if (!routeRendererRef.current) routeRendererRef.current = new RouteRenderer(map)
    return routeRendererRef.current
  }, [map])

  const removePopup = useCallback(() => {
    popupRef.current?.remove()
    popupRef.current = null
  }, [])

  const loadIsochrones = useCallback(async (coords: [number, number]) => {
    const times = selectedTimesRef.current
    const profile = modeRef.current
    if (times.length === 0) return

    isoAbortRef.current?.abort()
    const controller = new AbortController()
    isoAbortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const data = await fetchIsochrones(profile, coords, times, controller.signal)
      setIsochroneData(data)
      getIsoRenderer()?.render(data, coords)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'API hatası')
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setIsochroneData, getIsoRenderer])

  const startNewAnalysis = useCallback(async (coords: [number, number]) => {
    setOrigin(coords)
    setRouteData(null)
    setRouteStats(null)
    routeRendererRef.current?.remove()
    setAwaitingDestination(false)
    await loadIsochrones(coords)
  }, [setOrigin, setRouteData, setRouteStats, setAwaitingDestination, loadIsochrones])

  // Reload when mode or selectedTimes change with existing origin
  useEffect(() => {
    const coords = originRef.current
    if (!isActive || !coords || selectedTimes.length === 0) return
    loadIsochrones(coords)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedTimes])

  // Map click handler
  useEffect(() => {
    if (!map || !isActive) return

    map.getCanvas().style.cursor = 'crosshair'

    const handleClick = async (e: MapMouseEvent) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat]

      // ── Destination mode: always route regardless of where user clicked ──
      if (isAwaitingRef.current) {
        const from = originRef.current
        if (!from) return

        removePopup()
        setAwaitingDestination(false)

        routeAbortRef.current?.abort()
        const controller = new AbortController()
        routeAbortRef.current = controller

        setRouteLoading(true)
        setError(null)

        try {
          const feat = await fetchRoute(modeRef.current, from, coords, controller.signal)
          const summary = (feat.properties as Record<string, unknown>)?.summary as
            { distance?: number; duration?: number } | undefined
          if (summary) {
            setRouteStats({ distance: summary.distance ?? 0, duration: summary.duration ?? 0 })
          }
          setRouteData(feat)
          getRouteRenderer()?.render(feat)
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return
          setError(err instanceof Error ? err.message : 'Rota hesaplanamadı')
        } finally {
          setRouteLoading(false)
        }
        return
      }

      // ── Check if click is inside an existing isochrone polygon ──
      const hasIsochrone = Boolean(originRef.current)
      const insideIsochrone = hasIsochrone && map.queryRenderedFeatures(e.point, {
        layers: ['isochrone-fill'],
      }).length > 0

      if (insideIsochrone) {
        // Show context popup — user can choose directions or new analysis
        removePopup()

        const popup = new Popup({
          closeButton: false,
          closeOnClick: true,
          maxWidth: 'none',
          offset: 8,
          className: 'iso-context-popup',
        })
          .setLngLat(e.lngLat)
          .setHTML(POPUP_HTML)
          .addTo(map)

        popupRef.current = popup

        // Wire up buttons after popup is in DOM
        requestAnimationFrame(() => {
          const el = popup.getElement()

          el.querySelector('#iso-popup-directions')?.addEventListener('click', async () => {
            removePopup()
            const from = originRef.current
            if (!from) return

            routeAbortRef.current?.abort()
            const controller = new AbortController()
            routeAbortRef.current = controller

            setRouteLoading(true)
            setError(null)

            try {
              const feat = await fetchRoute(modeRef.current, from, coords, controller.signal)
              const summary = (feat.properties as Record<string, unknown>)?.summary as
                { distance?: number; duration?: number } | undefined
              if (summary) {
                setRouteStats({ distance: summary.distance ?? 0, duration: summary.duration ?? 0 })
              }
              setRouteData(feat)
              getRouteRenderer()?.render(feat)
            } catch (err) {
              if (err instanceof Error && err.name === 'AbortError') return
              setError(err instanceof Error ? err.message : 'Rota hesaplanamadı')
            } finally {
              setRouteLoading(false)
            }
          })

          el.querySelector('#iso-popup-new')?.addEventListener('click', () => {
            removePopup()
            startNewAnalysis(coords)
          })
        })
      } else {
        // Outside isochrone: clear everything, start fresh analysis
        removePopup()
        await startNewAnalysis(coords)
      }
    }

    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
      map.getCanvas().style.cursor = ''
    }
  }, [
    map, isActive, loadIsochrones, startNewAnalysis, removePopup,
    setRouteData, setRouteStats, setRouteLoading, setError,
    setAwaitingDestination, getRouteRenderer,
  ])

  // Cleanup on deactivate
  useEffect(() => {
    if (!isActive) {
      isoAbortRef.current?.abort()
      routeAbortRef.current?.abort()
      isoRendererRef.current?.remove()
      routeRendererRef.current?.remove()
      removePopup()
    }
  }, [isActive, removePopup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isoAbortRef.current?.abort()
      routeAbortRef.current?.abort()
      isoRendererRef.current?.remove()
      routeRendererRef.current?.remove()
      popupRef.current?.remove()
      isoRendererRef.current = null
      routeRendererRef.current = null
    }
  }, [])

  const startDirections = useCallback(() => {
    removePopup()
    setAwaitingDestination(true)
  }, [setAwaitingDestination, removePopup])

  const cancelDirections = useCallback(() => {
    setAwaitingDestination(false)
    routeAbortRef.current?.abort()
  }, [setAwaitingDestination])

  const deactivate = useCallback(() => {
    reset()
  }, [reset])

  return {
    isActive,
    isPanelOpen,
    mode,
    selectedTimes,
    origin,
    isochroneData,
    routeData,
    routeStats,
    isLoading,
    isRouteLoading,
    isAwaitingDestination,
    error,
    toggle,
    setMode,
    toggleTime,
    setOrigin,
    setPanelOpen,
    startDirections,
    cancelDirections,
    deactivate,
  }
}
