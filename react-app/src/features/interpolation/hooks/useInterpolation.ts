import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { useInterpolationStore } from '@/stores/useInterpolationStore'
import { useMapStore } from '@/stores/useMapStore'

import { InterpolationRenderer } from '../services/InterpolationRenderer'
import type {
  InterpolationResult,
  InterpolationWorkerInput,
  InterpolationWorkerOutput,
} from '../types'

function extractPointsFromItems(
  items: { geometry: GeoJSON.Geometry; properties: Record<string, unknown>; visible: boolean }[],
  valueColumn: string,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = []
  if (!valueColumn) return { type: 'FeatureCollection', features }

  const formatPointLabel = (value: number): string => {
    const abs = Math.abs(value)
    if (abs >= 100) return value.toFixed(0)
    if (abs >= 10) return value.toFixed(1)
    return value.toFixed(2)
  }

  for (const item of items) {
    if (!item.visible) continue
    const rawValue = item.properties[valueColumn]
    const value = typeof rawValue === 'string'
      ? parseFloat(rawValue.replace(',', '.'))
      : Number(rawValue)
    if (isNaN(value)) continue

    const coords = extractCentroidCoords(item.geometry)
    if (!coords) continue

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: { value, label: formatPointLabel(value) },
    })
  }

  return { type: 'FeatureCollection', features }
}

function extractCentroidCoords(geom: GeoJSON.Geometry): [number, number] | null {
  if (geom.type === 'Point') {
    const [lon, lat] = geom.coordinates
    return [lon, lat]
  }
  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
    const coords = geom.type === 'Polygon'
      ? geom.coordinates[0]
      : geom.coordinates.flat(1)[0]
    if (!coords || coords.length === 0) return null
    const [sumLon, sumLat] = coords.reduce(
      ([sLon, sLat], [lon, lat]) => [sLon + lon, sLat + lat],
      [0, 0],
    )
    return [sumLon / coords.length, sumLat / coords.length]
  }
  if (geom.type === 'LineString') {
    const mid = geom.coordinates[Math.floor(geom.coordinates.length / 2)]
    if (!mid) return null
    return [mid[0], mid[1]]
  }
  return null
}

function extractNumericColumns(
  items: { properties: Record<string, unknown>; visible: boolean }[],
): string[] {
  const counts = new Map<string, number>()
  const sampleSize = Math.min(items.length, 50)
  let sampled = 0

  for (const item of items) {
    if (!item.visible) continue
    if (sampled >= sampleSize) break
    sampled++

    for (const [key, raw] of Object.entries(item.properties)) {
      if (raw === null || raw === undefined) continue
      const value = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : Number(raw)
      if (!isNaN(value) && isFinite(value)) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= Math.max(1, Math.floor(sampled * 0.5)))
    .map(([key]) => key)
    .sort()
}

export function useInterpolation() {
  const map = useMapStore((s) => s.mapInstance)
  const items = useDataManagementStore((s) => s.items)

  const {
    isActive,
    isPanelOpen,
    config,
    result,
    isProcessing,
    error,
    legend,
    toggle,
    deactivate,
    setPanelOpen,
    setConfig,
    setResult,
    setIsProcessing,
    setError,
    setLegendTitle,
    setLegendPosition,
  } = useInterpolationStore()

  const rendererRef = useRef<InterpolationRenderer | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const runInterpolationRef = useRef<(() => Promise<void>) | null>(null)

  const getRenderer = useCallback(() => {
    if (!map) return null
    if (!rendererRef.current) rendererRef.current = new InterpolationRenderer(map)
    return rendererRef.current
  }, [map])

  const numericColumns = useMemo(() => extractNumericColumns(items), [items])

  const visibleItems = useMemo(() => items.filter((i) => i.visible), [items])

  const pointCount = useMemo(
    () => extractPointsFromItems(visibleItems, config.valueColumn).features.length,
    [visibleItems, config.valueColumn],
  )

  useEffect(() => {
    if (!config.valueColumn && numericColumns.length > 0) {
      setConfig({ valueColumn: numericColumns[0] })
    }
  }, [numericColumns, config.valueColumn, setConfig])

  useEffect(() => {
    const renderer = getRenderer()
    if (!renderer) return

    if (isActive && result) {
      renderer.render(result, config)
    } else {
      renderer.remove()
    }
  }, [isActive, result, config, getRenderer])

  // Hesaplamayı etkileyen ayarlar değişince haritayı anlık güncelle (debounce'lu).
  // Renk skalası, opaklık ve kriging gelişmiş ayarları bu listeye dahil değildir
  // (onlar sadece render güncellemesi gerektirir, ki yukarıdaki effect halleder).
  const recomputeKey = useMemo(
    () => {
      // classCount sadece isoband modunda geometriyi etkiliyor (break sayısı)
      // smooth ve poligon modlarında classCount sadece renk → render güncellemesi yeterli
      const classCountKey = config.gridType === 'isoband' ? config.classCount : 0
      return [
        config.method,
        config.gridType,
        config.cellWidth,
        config.idwPower,
        config.krigingModel,
        classCountKey,
        config.valueColumn,
      ].join('|')
    },
    [
      config.method,
      config.gridType,
      config.cellWidth,
      config.idwPower,
      config.krigingModel,
      config.classCount,
      config.valueColumn,
    ],
  )

  const lastRecomputeKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isActive) return
    if (!result) return
    if (lastRecomputeKeyRef.current === recomputeKey) return
    lastRecomputeKeyRef.current = recomputeKey

    const handle = window.setTimeout(() => {
      void runInterpolationRef.current?.()
    }, 750)
    return () => window.clearTimeout(handle)
    // result/runInterpolation bağımlılıkları kasıtlı olarak hariç: sonsuz döngüyü önlemek için
    // sadece recomputeKey değiştiğinde tetikleniyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recomputeKey, isActive])

  useEffect(() => {
    return () => {
      rendererRef.current?.remove()
      rendererRef.current = null
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [map])

  const runInterpolation = useCallback(async () => {
    if (!config.valueColumn) {
      setError('Lütfen bir değer sütunu seçin')
      return
    }
    const points = extractPointsFromItems(visibleItems, config.valueColumn)
    if (points.features.length < 3) {
      setError('En az 3 geçerli nokta gerekli')
      return
    }

    setError(null)
    setIsProcessing(true)

    workerRef.current?.terminate()
    const worker = new Worker(
      new URL('../services/interpolation.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    const input: InterpolationWorkerInput = { points, config }

    await new Promise<void>((resolve) => {
      worker.onmessage = (ev: MessageEvent<InterpolationWorkerOutput>) => {
        const data = ev.data
        if ('error' in data) {
          setError(data.error)
          setResult(null)
        } else {
          const payload: InterpolationResult = {
            grid: data.result.grid,
            raster: data.result.raster,
            points,
            min: data.result.min,
            max: data.result.max,
            valueColumn: config.valueColumn,
            method: config.method,
          }
          setResult(payload)
        }
        setIsProcessing(false)
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        resolve()
      }
      worker.onerror = (ev: ErrorEvent) => {
        setError(ev.message || 'Worker hatası')
        setIsProcessing(false)
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        resolve()
      }
      worker.postMessage(input)
    })
  }, [visibleItems, config, setError, setIsProcessing, setResult])

  useEffect(() => {
    runInterpolationRef.current = runInterpolation
  }, [runInterpolation])

  return {
    isActive,
    isPanelOpen,
    config,
    result,
    isProcessing,
    error,
    legend,
    numericColumns,
    pointCount,
    hasData: visibleItems.length > 0,
    setConfig,
    setPanelOpen,
    setLegendTitle,
    setLegendPosition,
    runInterpolation,
    deactivate,
    toggle,
  }
}
