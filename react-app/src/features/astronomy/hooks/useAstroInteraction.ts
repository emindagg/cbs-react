import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'

import { getLocalAstronomyData } from '../utils/astroUtils'

const ECLIPSE_LAYER_ID = 'astro-eclipse-marker'
const POPUP_OFFSET = 14
const POPUP_MAX_WIDTH = '260px'
const LOCAL_POPUP_MAX_WIDTH = '300px'
const LOCAL_POPUP_OFFSET = 18
const LOCATION_PIN_SIZE = '14px'
const LOCATION_PIN_CLASSNAME = 'astro-location-pin'
const INTERACTIVE_MARKER_CLASSNAME = 'astro-interactive-marker'

interface UseAstroInteractionParams {
  map: maplibregl.Map | null
  isEnabled: boolean
  isEclipseEnabled: boolean
  currentDate: Date
}

interface EclipseProperties {
  label?: string
  type?: string
  kind?: string
  date?: string
  time?: string
  magnitude?: string
  description?: string
}

function toSafeText(value: string | undefined): string {
  return value ?? '-'
}

function popupHtml(props: EclipseProperties): string {
  const title = toSafeText(props.label)
  const type = toSafeText(props.type)
  const kind = toSafeText(props.kind)
  const date = toSafeText(props.date)
  const time = toSafeText(props.time)
  const magnitude = toSafeText(props.magnitude)
  const description = toSafeText(props.description)

  return (
    '<div style="font-family:Outfit,ui-sans-serif,system-ui;padding:2px 0;color:#0f172a">' +
    `<div style="font-size:12px;font-weight:700;letter-spacing:.01em">${title}</div>` +
    '<div style="margin-top:6px;border-top:1px solid #e2e8f0;padding-top:6px;font-size:11px;line-height:1.45">' +
    `<div><strong>Tür:</strong> ${type} (${kind})</div>` +
    `<div><strong>Tarih:</strong> ${date}</div>` +
    `<div><strong>Saat:</strong> ${time}</div>` +
    `<div><strong>Büyüklük:</strong> ${magnitude}</div>` +
    `<div style="margin-top:6px;color:#475569">${description}</div>` +
    '</div>' +
    '</div>'
  )
}

export function useAstroInteraction({ map, isEnabled, isEclipseEnabled, currentDate }: UseAstroInteractionParams) {
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const locationPopupRef = useRef<maplibregl.Popup | null>(null)
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!map || !isEnabled || !isEclipseEnabled) {
      popupRef.current?.remove()
      popupRef.current = null
      return
    }
    if (!map.getLayer(ECLIPSE_LAYER_ID)) return

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: POPUP_OFFSET,
      maxWidth: POPUP_MAX_WIDTH,
      className: 'astro-eclipse-popup',
    })
    popupRef.current = popup

    const onClick = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature || feature.geometry.type !== 'Point') return
      const [lon, lat] = feature.geometry.coordinates as [number, number]
      const properties = (feature.properties ?? {}) as EclipseProperties

      popup
        .setLngLat([lon, lat])
        .setHTML(popupHtml(properties))
        .addTo(map)
    }

    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', ECLIPSE_LAYER_ID, onClick)
    map.on('mouseenter', ECLIPSE_LAYER_ID, onEnter)
    map.on('mouseleave', ECLIPSE_LAYER_ID, onLeave)

    return () => {
      map.off('click', ECLIPSE_LAYER_ID, onClick)
      map.off('mouseenter', ECLIPSE_LAYER_ID, onEnter)
      map.off('mouseleave', ECLIPSE_LAYER_ID, onLeave)
      map.getCanvas().style.cursor = ''
      popup.remove()
      popupRef.current = null
    }
  }, [map, isEnabled, isEclipseEnabled])

  useEffect(() => {
    if (!map || !isEnabled) {
      locationPopupRef.current?.remove()
      locationPopupRef.current = null
      locationMarkerRef.current?.remove()
      locationMarkerRef.current = null
      return
    }

    const ensureLocationMarker = () => {
      if (locationMarkerRef.current) return locationMarkerRef.current

      const pin = document.createElement('div')
      pin.className = LOCATION_PIN_CLASSNAME
      pin.style.width = LOCATION_PIN_SIZE
      pin.style.height = LOCATION_PIN_SIZE
      pin.style.borderRadius = '9999px'
      pin.style.background = '#ef4444'
      pin.style.border = '2px solid #ffffff'
      pin.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.25)'

      locationMarkerRef.current = new maplibregl.Marker({
        element: pin,
        anchor: 'bottom',
      })

      return locationMarkerRef.current
    }

    const clearLocationQuery = () => {
      locationPopupRef.current?.remove()
      locationPopupRef.current = null
      locationMarkerRef.current?.remove()
      locationMarkerRef.current = null
    }

    const ensureLocationPopup = () => {
      if (locationPopupRef.current) return locationPopupRef.current

      locationPopupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: [0, -LOCAL_POPUP_OFFSET],
        maxWidth: LOCAL_POPUP_MAX_WIDTH,
        className: 'astro-location-popup',
      })

      locationPopupRef.current.on('close', () => {
        locationMarkerRef.current?.remove()
        locationMarkerRef.current = null
        locationPopupRef.current = null
      })

      return locationPopupRef.current
    }

    const onMapClick = (e: maplibregl.MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement | null
      if (target?.closest(`.${INTERACTIVE_MARKER_CLASSNAME}`)) {
        return
      }

      const clickedEclipseFeature = map.queryRenderedFeatures(e.point, { layers: [ECLIPSE_LAYER_ID] })
      if (clickedEclipseFeature.length > 0) {
        return
      }

      // Singleton behavior: clear previous query marker/popup before placing a new one.
      clearLocationQuery()

      const { lng, lat } = e.lngLat
      const info = getLocalAstronomyData(currentDate, lat, lng)
      const locationMarker = ensureLocationMarker()
      const locationPopup = ensureLocationPopup()

      locationMarker
        .setLngLat([lng, lat])
        .addTo(map)

      locationPopup
        .setLngLat([lng, lat])
        .setHTML(
          '<div style="font-family:Outfit,ui-sans-serif,system-ui;padding:2px 0;color:#0f172a">' +
          '<div style="font-size:12px;font-weight:700;letter-spacing:.01em">Konum Sorgulama</div>' +
          '<div style="margin-top:6px;border-top:1px solid #e2e8f0;padding-top:6px;font-size:11px;line-height:1.45">' +
          `<div><strong>Konum:</strong> ${info.latText}, ${info.lonText}</div>` +
          `<div><strong>Güneş Yüksekliği:</strong> ${info.altitude}</div>` +
          `<div><strong>Yön (Azimuth):</strong> ${info.azimuth}</div>` +
          `<div><strong>Gün Doğumu:</strong> ${info.sunrise}</div>` +
          `<div><strong>Gün Batımı:</strong> ${info.sunset}</div>` +
          `<div><strong>Gölge Boyu (1m):</strong> ${info.shadowLength}</div>` +
          '</div></div>',
        )
        .addTo(map)
    }

    map.on('click', onMapClick)

    return () => {
      map.off('click', onMapClick)
      clearLocationQuery()
    }
  }, [map, isEnabled, currentDate])

  useEffect(() => () => {
    locationPopupRef.current?.remove()
    locationPopupRef.current = null
    locationMarkerRef.current?.remove()
    locationMarkerRef.current = null
  }, [])
}
