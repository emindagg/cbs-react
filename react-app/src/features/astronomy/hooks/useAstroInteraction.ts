import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'

const ECLIPSE_LAYER_ID = 'astro-eclipse-marker'
const POPUP_OFFSET = 14
const POPUP_MAX_WIDTH = '260px'

interface UseAstroInteractionParams {
  map: maplibregl.Map | null
  isEnabled: boolean
  isEclipseEnabled: boolean
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

export function useAstroInteraction({ map, isEnabled, isEclipseEnabled }: UseAstroInteractionParams) {
  const popupRef = useRef<maplibregl.Popup | null>(null)

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
}
