import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { useMapStore } from '@/stores/useMapStore'

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseGeolocationReturn {
    status: GeolocationStatus
    errorMessage: string | null
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

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude, latitude, accuracy } = position.coords

                // Önceki marker'ı kaldır
                markerRef.current?.remove()

                // Özel konum marker'ı oluştur
                const el = document.createElement('div')
                el.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
          cursor: default;
        `

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
                const zoom = accuracy < 100 ? 15 : accuracy < 1000 ? 13 : 11
                mapInstance.flyTo({
                    center: [longitude, latitude],
                    zoom,
                    duration: 1500,
                    essential: true,
                })

                setStatus('success')
            },
            (err) => {
                setStatus('error')
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setErrorMessage('Konum izni reddedildi.')
                        break
                    case err.POSITION_UNAVAILABLE:
                        setErrorMessage('Konum bilgisi alınamadı.')
                        break
                    case err.TIMEOUT:
                        setErrorMessage('Konum isteği zaman aşımına uğradı.')
                        break
                    default:
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

    return { status, errorMessage, locate }
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
    const distanceDeg = radiusMeters / 111320 // yaklaşık metre → derece

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
