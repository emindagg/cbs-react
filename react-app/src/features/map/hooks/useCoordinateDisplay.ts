import { useEffect, useRef, useState } from 'react'

import { useMapStore } from '@/stores/useMapStore'

export interface MouseCoords {
    lng: number
    lat: number
}

/**
 * useCoordinateDisplay
 *
 * Harita üzerindeki mouse hareketini dinler ve anlık koordinatları döndürür.
 * Bileşen mantığını (event binding / cleanup) UI'dan ayırır.
 */
export function useCoordinateDisplay() {
    const mapInstance = useMapStore((state) => state.mapInstance)
    const [coords, setCoords] = useState<MouseCoords | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const isVisibleRef = useRef(false)   // closure'da stale state'i önler

    useEffect(() => {
        if (!mapInstance) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleMove = (e: any) => {
            setCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat })
            if (!isVisibleRef.current) {
                isVisibleRef.current = true
                setIsVisible(true)
            }
        }

        const handleLeave = () => {
            isVisibleRef.current = false
            setIsVisible(false)
        }

        mapInstance.on('mousemove', handleMove)
        mapInstance.on('mouseleave', handleLeave)

        return () => {
            mapInstance.off('mousemove', handleMove)
            mapInstance.off('mouseleave', handleLeave)
        }
    }, [mapInstance])

    return { coords, isVisible }
}
