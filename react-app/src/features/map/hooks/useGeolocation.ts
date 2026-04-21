import maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useMapStore } from '@/stores/useMapStore'

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseGeolocationReturn {
  status: GeolocationStatus
  errorMessage: string | null
  isPermissionDenied: boolean
  locate: () => void
}

/**
 * useGeolocation
 *
 * Tarayıcının Geolocation API'sini kullanarak kullanıcının konumunu bulur,
 * haritayı o noktaya uçurur ve bir marker yerleştirir.
 * Harici kütüphane gerektirmez.
 */
export function useGeolocation(): UseGeolocationReturn {
  const mapInstance = useMapStore((state) => state.mapInstance)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  // Harita değiştiğinde eski marker'ı temizle
  useEffect(() => {
    return () => {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [mapInstance])

  const locate = useCallback(() => {
    if (!mapInstance) return

    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage('Tarayıcınız konum özelliğini desteklemiyor.')
      return
    }

    setStatus('loading')
    setErrorMessage(null)
    setIsPermissionDenied(false)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude, accuracy } = position.coords

        // Önceki marker'ı kaldır
        markerRef.current?.remove()

        // Özel SVG konum marker'ı
        const el = document.createElement('div')
        el.style.cssText = 'width:36px;height:36px;cursor:pointer;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.4));'
        el.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="22" fill="none" stroke="black" stroke-width="5">
            <animate attributeName="r"       values="22;46;22" dur="3.5s" repeatCount="indefinite" calcMode="ease-out"/>
            <animate attributeName="opacity" values="0.7;0;0.7" dur="3.5s" repeatCount="indefinite" calcMode="ease-out"/>
          </circle>
          <circle cx="50" cy="50" r="20" fill="white" stroke="black" stroke-width="8"/>
          <circle cx="50" cy="50" r="6"  fill="black"/>
        </svg>`

        // Doğruluk çemberi (accuracy circle) — MapLibre Source/Layer olarak
        const sourceId = 'geolocation-accuracy'
        const layerId = 'geolocation-accuracy-fill'
        const outlineId = 'geolocation-accuracy-outline'

        // Önceki accuracy layer'ları temizle
        if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId)
        if (mapInstance.getLayer(outlineId)) mapInstance.removeLayer(outlineId)
        if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId)

        // GeoJSON çember (accuracy alanı)
        const circle = createGeoJSONCircle([longitude, latitude], accuracy)
        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: circle,
        })
        mapInstance.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.12,
          },
        })
        mapInstance.addLayer({
          id: outlineId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#3b82f6',
            'line-width': 1.5,
            'line-opacity': 0.5,
          },
        })

        // Marker ekle
        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(mapInstance)

        // Haritayı konuma uçur
        // eslint-disable-next-line no-magic-numbers
        const zoom = accuracy < 100 ? 15 : accuracy < 1000 ? 13 : 11
        mapInstance.flyTo({
          center: [longitude, latitude],
          zoom,
          duration: 1500,
          essential: true,
        })

        // Temaya uygun popup CSS — bir kez enjekte et
        if (!document.getElementById('geo-popup-style')) {
          const style = document.createElement('style')
          style.id = 'geo-popup-style'
          style.textContent = `
                        .geo-popup .maplibregl-popup-content {
                            background: #1c1c1e;
                            border: 1px solid rgba(255,255,255,0.10);
                            border-radius: 10px;
                            box-shadow: 0 8px 28px rgba(0,0,0,0.45);
                            padding: 14px 16px;
                            min-width: 210px;
                            font-family: system-ui, -apple-system, sans-serif;
                        }
                        .geo-popup .maplibregl-popup-tip {
                            border-top-color: #1c1c1e !important;
                        }
                        .geo-popup .maplibregl-popup-close-button {
                            color: #475569;
                            font-size: 16px;
                            padding: 6px 10px;
                            line-height: 1;
                            background: transparent;
                            border: none;
                        }
                        .geo-popup .maplibregl-popup-close-button:hover {
                            color: #e2e8f0;
                            background: transparent;
                        }
                    `
          document.head.appendChild(style)
        }

        // Popup içeriği
        const accuracyLabel = accuracy < 1000
          ? `±${Math.round(accuracy)} m`
          : `±${(accuracy / 1000).toFixed(1)} km`

        const popupEl = document.createElement('div')
        popupEl.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                        <svg width="14" height="14" viewBox="0 0 100 100" style="flex-shrink:0">
                            <circle cx="50" cy="50" r="20" fill="white" stroke="black" stroke-width="8"/>
                            <circle cx="50" cy="50" r="6" fill="black"/>
                        </svg>
                        <span style="font-weight:600;font-size:13px;color:#f1f5f9;letter-spacing:0.01em;">Konumunuz</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <div>
                            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Koordinat</div>
                            <div style="font-family:'SF Mono','Fira Mono',monospace;font-size:12px;color:#e2e8f0;">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</div>
                        </div>
                        <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
                        <div>
                            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Doğruluk</div>
                            <div style="font-family:'SF Mono','Fira Mono',monospace;font-size:12px;color:#e2e8f0;">${accuracyLabel}</div>
                        </div>
                    </div>
                `

        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 22,
          className: 'geo-popup',
          maxWidth: '260px',
        }).setDOMContent(popupEl)

        // Marker'a popup bağla — tıklayınca aç/kapat
        markerRef.current!.setPopup(popup)
        markerRef.current!.togglePopup() // ilk açılışta otomatik göster

        setStatus('success')
      },
      (err) => {
        setStatus('error')
        if (err.code === err.PERMISSION_DENIED) {
          setIsPermissionDenied(true)
          setErrorMessage('Konum izni reddedildi.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMessage('Konum bilgisi alınamadı.')
        } else if (err.code === err.TIMEOUT) {
          setErrorMessage('Konum isteği zaman aşımına uğradı.')
        } else {
          setErrorMessage('Bilinmeyen bir konum hatası oluştu.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [mapInstance])

  return { status, errorMessage, isPermissionDenied, locate }
}

/**
 * Merkez ve yarıçap (metre) cinsinden GeoJSON Polygon çemberi üretir.
 */
function createGeoJSONCircle(
  center: [number, number],
  radiusMeters: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center
  const coords: [number, number][] = []
  const METERS_PER_DEGREE = 111320 // enlemde yaklaşık 1° uzunluğu (metre)
  const distanceDeg = radiusMeters / METERS_PER_DEGREE

  for (let i = 0; i < points; i++) {
    const angle = (i * 360) / points
    const rad = (angle * Math.PI) / 180
    coords.push([
      lng + distanceDeg * Math.sin(rad) / Math.cos((lat * Math.PI) / 180),
      lat + distanceDeg * Math.cos(rad),
    ])
  }
  coords.push(coords[0]) // kapalı çember

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }
}
