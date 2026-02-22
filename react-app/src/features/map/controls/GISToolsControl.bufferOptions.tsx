import * as turf from '@turf/turf'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'
import type { DataItem } from '../../data-management/types'
import { BUFFER_MODE_COLORS } from './GISToolsControl.bufferColors'

type BufferOption = 'normal' | 'combined' | 'intersection' | 'difference' | 'summary'
type DerivedBufferType = 'combined' | 'intersection' | 'difference'

interface BufferDetailSummary {
  id: string
  name: string
  radiusKm: number | null
  areaKm2: number
  perimeterKm: number
}

interface BufferDetailSegment extends BufferDetailSummary {
  feature: Feature<Polygon | MultiPolygon>
}

interface BufferStatisticalSummary {
  layerCount: number
  totalAreaKm2: number
  mergedAreaKm2: number
  averageRadiusKm: number | null
  minRadiusKm: number | null
  maxRadiusKm: number | null
  overlapPairCount: number
  overlapRatioPercent: number
  overlapAreaHectare: number
  details: BufferDetailSummary[]
}

interface BufferOptionsControlProps {
  hasBufferResults: boolean
}

const BUFFER_ANALYSIS_TAG = 'buffer'
const SQUARE_METERS_IN_KM2 = 1_000_000
const SQUARE_METERS_IN_HECTARE = 10_000

function isBufferAnalysisItem(item: DataItem): boolean {
  return item.properties.analysis === BUFFER_ANALYSIS_TAG
}

function isDerivedBufferItem(item: DataItem): boolean {
  return isBufferAnalysisItem(item) && item.properties.bufferDerived === true
}

function isBaseBufferItem(item: DataItem): boolean {
  return isBufferAnalysisItem(item) && !isDerivedBufferItem(item)
}

function toPolygonFeatures(items: DataItem[]): Feature<Polygon | MultiPolygon>[] {
  const polygonFeatures: Feature<Polygon | MultiPolygon>[] = []

  for (const item of items) {
    try {
      const flattened = turf.flatten(turf.feature(item.geometry))
      for (const feature of flattened.features) {
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          polygonFeatures.push(feature as Feature<Polygon | MultiPolygon>)
        }
      }
    } catch {
      continue
    }
  }

  return polygonFeatures
}

function normalizeForOverlay(f: Feature<Polygon | MultiPolygon>): Feature<Polygon | MultiPolygon> | null {
  try {
    const rewound = turf.rewind(f, { reverse: false })
    if (!rewound?.geometry) return null

    const geometry = rewound.geometry
    if (geometry.type === 'MultiPolygon' && geometry.coordinates.length > 1) {
      const flattened = turf.flatten(rewound)
      const polygons = (flattened as FeatureCollection<Polygon>).features.filter(
        feature => feature.geometry.type === 'Polygon',
      ) as Feature<Polygon>[]
      if (polygons.length === 0) return rewound as Feature<Polygon | MultiPolygon>
      if (polygons.length === 1) return polygons[0]

      const unioned = turf.union(turf.featureCollection(polygons)) as Feature<Polygon | MultiPolygon> | null
      return unioned ?? (rewound as Feature<Polygon | MultiPolygon>)
    }

    return rewound as Feature<Polygon | MultiPolygon>
  } catch {
    return null
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value)
}

function formatDistanceKm(value: number | null): string {
  return value == null ? '-' : `${value.toFixed(2)} km`
}

function formatAreaKm2(value: number): string {
  return `${formatNumber(value)} km²`
}

function formatAreaHectares(value: number): string {
  return `${formatNumber(value)} ha`
}

function formatPercent(value: number): string {
  return `%${value.toFixed(1)}`
}

function formatTableMetric(value: number, suffix: string): string {
  return `${value.toFixed(2)} ${suffix}`
}

function toKilometers(distance: number, unit: unknown): number | null {
  if (!Number.isFinite(distance)) return null

  switch (unit) {
    case 'meters':
      return distance / 1000
    case 'kilometers':
      return distance
    case 'miles':
      return distance * 1.609344
    case 'nauticalmiles':
      return distance * 1.852
    case 'yards':
      return distance * 0.0009144
    case 'feet':
      return distance * 0.0003048
    default:
      return null
  }
}

function parseDistanceFromName(name: string): { distance: number; unit: string } | null {
  const match = name.match(/buffer\(([-+]?\d+(?:[.,]\d+)?)\s*([^)]+)\)/i)
  if (!match) return null

  const distance = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(distance)) return null

  const unitToken = match[2].trim().toLowerCase()
  if (unitToken.startsWith('km')) {
    return { distance, unit: 'kilometers' }
  }
  if (unitToken.startsWith('m')) {
    return { distance, unit: 'meters' }
  }
  return { distance, unit: unitToken }
}

function getBufferRadiusKm(item: DataItem): number | null {
  const rawDistance = item.properties.bufferDistance
  const rawUnit = item.properties.bufferUnit

  if (typeof rawDistance === 'number') {
    const fromMeta = toKilometers(rawDistance, rawUnit)
    if (fromMeta != null) return fromMeta
  }

  const parsed = parseDistanceFromName(item.name)
  if (!parsed) return null

  return toKilometers(parsed.distance, parsed.unit)
}

function getBufferDisplayName(item: DataItem, fallbackIndex: number): string {
  const match = item.name.match(/Buffer\([^)]*\)\s*-\s*(.+)$/i)
  if (match?.[1]?.trim()) return match[1].trim()
  if (item.name.trim()) return item.name.trim()
  return String(fallbackIndex + 1)
}

function getBufferSourceNames(item: DataItem): string[] {
  const raw = item.properties.bufferSourceNames
  if (!Array.isArray(raw)) return []
  return raw.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
}

function buildBufferDetailSegments(item: DataItem, fallbackIndex: number): BufferDetailSegment[] {
  const baseName = getBufferDisplayName(item, fallbackIndex)
  const sourceNames = getBufferSourceNames(item)
  const radiusKm = getBufferRadiusKm(item)
  let polygonFeatures: Feature<Polygon | MultiPolygon>[] = []

  try {
    const flattened = turf.flatten(turf.feature(item.geometry))
    polygonFeatures = flattened.features.filter(
      feature => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon',
    ) as Feature<Polygon | MultiPolygon>[]
  } catch {
    return []
  }

  if (polygonFeatures.length === 0) return []

  const useSourceNames = sourceNames.length === polygonFeatures.length

  return polygonFeatures.map((feature, polygonIndex) => {
    const name = useSourceNames
      ? sourceNames[polygonIndex]
      : polygonFeatures.length === 1
        ? baseName
        : `${baseName} ${polygonIndex + 1}`

    return {
      id: `${item.id}-${polygonIndex + 1}`,
      name,
      radiusKm,
      areaKm2: turf.area(feature) / SQUARE_METERS_IN_KM2,
      perimeterKm: getPerimeterKm(feature.geometry),
      feature,
    }
  })
}

function getPerimeterKm(geometry: Polygon | MultiPolygon): number {
  const flattened = turf.flatten(turf.feature(geometry))
  return flattened.features.reduce((sum, feature) => {
    if (feature.geometry.type !== 'Polygon') return sum
    const ringLength = feature.geometry.coordinates.reduce((ringTotal, ring) => (
      ringTotal + turf.length(turf.lineString(ring), { units: 'kilometers' })
    ), 0)
    return sum + ringLength
  }, 0)
}

function unionFeatures(features: Feature<Polygon | MultiPolygon>[]): Feature<Polygon | MultiPolygon> | null {
  if (features.length === 0) return null
  if (features.length === 1) return features[0]

  let current: Feature<Polygon | MultiPolygon> | null = features[0]
  for (let index = 1; index < features.length; index += 1) {
    if (!current) return null
    try {
      const unioned = turf.union(
        turf.featureCollection([current, features[index]]),
      ) as Feature<Polygon | MultiPolygon> | null
      current = unioned ?? null
    } catch {
      return null
    }
  }

  return current
}

function getOptionLabel(option: BufferOption): string {
  switch (option) {
    case 'normal':
      return 'Normal'
    case 'combined':
      return 'Birleşik'
    case 'intersection':
      return 'Kesişim'
    case 'difference':
      return 'Fark'
    case 'summary':
      return 'İstatistiksel Özetler'
    default:
      return option
  }
}

function getOptionColor(option: BufferOption): string {
  switch (option) {
    case 'normal':
      return BUFFER_MODE_COLORS.normal
    case 'combined':
      return BUFFER_MODE_COLORS.combined
    case 'intersection':
      return BUFFER_MODE_COLORS.intersection
    case 'difference':
      return BUFFER_MODE_COLORS.difference
    case 'summary':
      return '#334155'
    default:
      return '#334155'
  }
}

function getItemFillColor(item: DataItem): string | null {
  const rawStyle = item.properties.style
  if (!rawStyle || typeof rawStyle !== 'object') return null
  const fillColor = (rawStyle as Record<string, unknown>).fillColor
  return typeof fillColor === 'string' ? fillColor : null
}

const DRAG_THRESHOLD = 6

export function BufferOptionsControl({ hasBufferResults }: BufferOptionsControlProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<BufferOption>('normal')
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ offsetX: number; offsetY: number; startX: number; startY: number } | null>(null)
  const didDragRef = useRef(false)

  const items = useDataManagementStore(state => state.items)
  const addItem = useDataManagementStore(state => state.addItem)
  const removeItem = useDataManagementStore(state => state.removeItem)
  const toggleVisibility = useDataManagementStore(state => state.toggleVisibility)
  const updateItemFillColor = useDataManagementStore(state => state.updateItemFillColor)

  const bufferItems = useMemo(
    () => items.filter(isBufferAnalysisItem),
    [items],
  )

  const baseBufferItems = useMemo(
    () => bufferItems.filter(isBaseBufferItem),
    [bufferItems],
  )

  const polygonFeatures = useMemo(
    () => toPolygonFeatures(baseBufferItems),
    [baseBufferItems],
  )

  const statisticalSummary = useMemo<BufferStatisticalSummary | null>(() => {
    if (selectedOption !== 'summary') return null

    const visibleBaseBufferItems = baseBufferItems.filter(item => item.visible)
    const targetItems = visibleBaseBufferItems.length > 0 ? visibleBaseBufferItems : baseBufferItems
    if (targetItems.length === 0) return null

    const detailSegments = targetItems.flatMap((item, index) => buildBufferDetailSegments(item, index))
    if (detailSegments.length === 0) return null

    const details = detailSegments.map(({ feature: _feature, ...detail }) => detail)
    const totalAreaKm2 = detailSegments.reduce((sum, detail) => sum + detail.areaKm2, 0)
    const mergedFeature = unionFeatures(detailSegments.map(detail => detail.feature))
    const mergedAreaKm2 = mergedFeature
      ? turf.area(mergedFeature) / SQUARE_METERS_IN_KM2
      : totalAreaKm2

    const overlapAreaKm2 = Math.max(0, totalAreaKm2 - mergedAreaKm2)
    const overlapAreaHectare = overlapAreaKm2 * 100

    const radiusValues = detailSegments
      .map(detail => detail.radiusKm)
      .filter((radius): radius is number => radius != null && Number.isFinite(radius))

    const averageRadiusKm = radiusValues.length > 0
      ? radiusValues.reduce((sum, radius) => sum + radius, 0) / radiusValues.length
      : null
    const minRadiusKm = radiusValues.length > 0 ? Math.min(...radiusValues) : null
    const maxRadiusKm = radiusValues.length > 0 ? Math.max(...radiusValues) : null

    const normalizedFeatures = detailSegments
      .map(detail => detail.feature)
      .map(normalizeForOverlay)
      .filter((feature): feature is Feature<Polygon | MultiPolygon> => feature != null)

    let overlapPairCount = 0
    for (let left = 0; left < normalizedFeatures.length; left += 1) {
      for (let right = left + 1; right < normalizedFeatures.length; right += 1) {
        try {
          const overlap = turf.intersect(
            turf.featureCollection([normalizedFeatures[left], normalizedFeatures[right]]),
          )
          if (overlap && turf.area(overlap) > 0) {
            overlapPairCount += 1
          }
        } catch {
          continue
        }
      }
    }

    const totalAreaSquareMeters = totalAreaKm2 * SQUARE_METERS_IN_KM2
    const overlapAreaSquareMeters = overlapAreaHectare * SQUARE_METERS_IN_HECTARE
    const overlapRatioPercent = totalAreaSquareMeters > 0
      ? (overlapAreaSquareMeters / totalAreaSquareMeters) * 100
      : 0

    return {
      layerCount: details.length,
      totalAreaKm2,
      mergedAreaKm2,
      averageRadiusKm,
      minRadiusKm,
      maxRadiusKm,
      overlapPairCount,
      overlapRatioPercent,
      overlapAreaHectare,
      details,
    }
  }, [baseBufferItems, selectedOption])

  useEffect(() => {
    if (!hasBufferResults) {
      setIsPopupOpen(false)
      setIsStatsModalOpen(false)
      setSelectedOption('normal')
    }
  }, [hasBufferResults])

  useEffect(() => {
    if (!isPopupOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsPopupOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPopupOpen])

  useEffect(() => {
    if (selectedOption !== 'summary') {
      setIsStatsModalOpen(false)
    }
  }, [selectedOption])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const start = dragStartRef.current
      if (!start) return
      if (Math.abs(e.clientX - start.startX) > DRAG_THRESHOLD || Math.abs(e.clientY - start.startY) > DRAG_THRESHOLD) {
        didDragRef.current = true
      }
      setDragPosition({ x: e.clientX - start.offsetX, y: e.clientY - start.offsetY })
    }
    const onUp = () => {
      dragStartRef.current = null
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  const handlePointerDown = (e: React.MouseEvent) => {
    e.preventDefault()
    didDragRef.current = false
    if (dragPosition === null && popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect()
      setDragPosition({ x: rect.left, y: rect.top })
      dragStartRef.current = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        startX: e.clientX,
        startY: e.clientY,
      }
    } else if (dragPosition !== null) {
      dragStartRef.current = {
        offsetX: e.clientX - dragPosition.x,
        offsetY: e.clientY - dragPosition.y,
        startX: e.clientX,
        startY: e.clientY,
      }
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault()
      didDragRef.current = false
      return
    }
    setIsPopupOpen(prev => !prev)
  }

  useEffect(() => {
    if (selectedOption !== 'normal') return
    baseBufferItems.forEach(item => {
      if (getItemFillColor(item) !== BUFFER_MODE_COLORS.normal) {
        updateItemFillColor(item.id, BUFFER_MODE_COLORS.normal)
      }
    })
  }, [baseBufferItems, selectedOption, updateItemFillColor])

  const removeDerivedLayers = () => {
    const derivedItems = bufferItems.filter(isDerivedBufferItem)
    derivedItems.forEach(item => removeItem(item.id))
  }

  const setBaseVisibility = (visible: boolean) => {
    baseBufferItems.forEach(item => {
      if (item.visible !== visible) toggleVisibility(item.id)
    })
  }

  const addDerivedLayer = (type: DerivedBufferType, geometry: Polygon | MultiPolygon) => {
    const typeLabel = type === 'combined'
      ? 'Birleşik'
      : type === 'intersection'
        ? 'Kesişim'
        : 'Fark'

    const typeColor = type === 'combined'
      ? BUFFER_MODE_COLORS.combined
      : type === 'intersection'
        ? BUFFER_MODE_COLORS.intersection
        : BUFFER_MODE_COLORS.difference

    addItem({
      name: `Buffer ${typeLabel} Sonucu`,
      date: new Date().toISOString(),
      type: 'polygon',
      geometry,
      properties: {
        analysis: BUFFER_ANALYSIS_TAG,
        bufferDerived: true,
        bufferDerivedType: type,
        style: { fillColor: typeColor },
      },
    })
  }

  const activateNormal = () => {
    removeDerivedLayers()
    setBaseVisibility(true)
    baseBufferItems.forEach(item => updateItemFillColor(item.id, BUFFER_MODE_COLORS.normal))
    setSelectedOption('normal')
  }

  const activateCombined = () => {
    if (polygonFeatures.length === 0) {
      toast.error('Birleşik sonuç için buffer katmanı bulunamadı.')
      return
    }

    removeDerivedLayers()

    let mergedGeometry: Polygon | MultiPolygon | null = null
    if (polygonFeatures.length === 1) {
      mergedGeometry = polygonFeatures[0].geometry
    } else {
      try {
        const unioned = turf.union(
          turf.featureCollection(polygonFeatures),
        ) as Feature<Polygon | MultiPolygon> | null
        mergedGeometry = (unioned?.geometry as Polygon | MultiPolygon | undefined) ?? null
      } catch {
        mergedGeometry = null
      }
    }

    if (!mergedGeometry) {
      toast.error('Buffer katmanları birleştirilemedi.')
      return
    }

    addDerivedLayer('combined', mergedGeometry)
    setBaseVisibility(false)
    setSelectedOption('combined')
  }

  const activateOverlay = (mode: 'intersection' | 'difference') => {
    // polygonFeatures = flatten(baseBufferItems); tek katmandaki 3 daire → 3 poligon sayılır
    if (polygonFeatures.length < 2) {
      toast.error('Kesişim/Fark için en az 2 buffer poligonu gerekli.')
      return
    }

    const sourceFeatures = polygonFeatures
      .map(normalizeForOverlay)
      .filter((f): f is Feature<Polygon | MultiPolygon> => f != null)

    if (sourceFeatures.length < 2) {
      toast.error('Geometriler normalize edilemedi (kesişim/fark için uygun değil).')
      return
    }

    removeDerivedLayers()
    setBaseVisibility(true)

    let overlayGeometry: Polygon | MultiPolygon | null = null
    try {
      if (mode === 'intersection') {
        if (sourceFeatures.length === 2) {
          const result = turf.intersect(turf.featureCollection([sourceFeatures[0], sourceFeatures[1]]))
          overlayGeometry = (result?.geometry as Polygon | MultiPolygon | undefined) ?? null
        } else {
          const intersections: Feature<Polygon | MultiPolygon>[] = []
          for (let left = 0; left < sourceFeatures.length; left += 1) {
            for (let right = left + 1; right < sourceFeatures.length; right += 1) {
              const pairIntersection = turf.intersect(
                turf.featureCollection([sourceFeatures[left], sourceFeatures[right]]),
              )
              if (pairIntersection) {
                intersections.push(pairIntersection as Feature<Polygon | MultiPolygon>)
              }
            }
          }
          overlayGeometry = unionFeatures(intersections)?.geometry ?? null
        }
      } else {
        // Symmetric difference: (A \ B) ∪ (B \ A) then fold with next.
        let current: Feature<Polygon | MultiPolygon> | null = sourceFeatures[0]
        for (let index = 1; index < sourceFeatures.length; index += 1) {
          if (!current) break
          const next = sourceFeatures[index]
          const diffAB = turf.difference(turf.featureCollection([current, next]))
          const diffBA = turf.difference(turf.featureCollection([next, current]))

          if (diffAB && diffBA) {
            const unioned = turf.union(turf.featureCollection([
              diffAB as Feature<Polygon | MultiPolygon>,
              diffBA as Feature<Polygon | MultiPolygon>,
            ])) as Feature<Polygon | MultiPolygon> | null
            current = unioned ?? null
          } else if (diffAB) {
            current = diffAB as Feature<Polygon | MultiPolygon>
          } else if (diffBA) {
            current = diffBA as Feature<Polygon | MultiPolygon>
          } else {
            current = null
          }
        }
        overlayGeometry = current?.geometry ?? null
      }
    } catch (err) {
      overlayGeometry = null
      if (import.meta.env.DEV && err instanceof Error) {
        console.warn('[Buffer Analiz] Kesişim/Fark hatası:', err.message)
      }
    }

    if (!overlayGeometry) {
      toast.error(mode === 'intersection' ? 'Kesişim sonucu bulunamadı.' : 'Fark sonucu üretilemedi.')
      return
    }

    addDerivedLayer(mode, overlayGeometry)
    setSelectedOption(mode)
  }

  const activateSummary = () => {
    const visibleBaseBufferItems = baseBufferItems.filter(item => item.visible)
    const targetItems = visibleBaseBufferItems.length > 0 ? visibleBaseBufferItems : baseBufferItems
    if (targetItems.length === 0) {
      toast.error('İstatistik için buffer katmanı bulunamadı.')
      return
    }
    setSelectedOption('summary')
    setIsStatsModalOpen(true)
  }

  const handleOptionSelect = (option: BufferOption) => {
    switch (option) {
      case 'normal':
        activateNormal()
        return
      case 'combined':
        activateCombined()
        return
      case 'intersection':
        activateOverlay('intersection')
        return
      case 'difference':
        activateOverlay('difference')
        return
      case 'summary':
        activateSummary()
        return
      default:
        return
    }
  }

  if (!hasBufferResults) return null

  const primaryOptions: BufferOption[] = ['normal', 'combined', 'intersection', 'difference']

  const isSummarySelected = selectedOption === 'summary'
  const showStatsModal = isStatsModalOpen && statisticalSummary != null

  const wrapperStyle: React.CSSProperties = dragPosition
    ? { position: 'fixed', left: dragPosition.x, top: dragPosition.y, zIndex: 10003 }
    : undefined

  return (
    <>
      <div
        ref={popupRef}
        className={dragPosition ? 'relative' : 'mt-2 w-auto relative'}
        style={wrapperStyle}
      >
        <button
          type="button"
          onMouseDown={handlePointerDown}
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[11px] font-medium shadow-sm border border-violet-400/40 transition-colors cursor-grab active:cursor-grabbing"
          title="Analiz seçenekleri (sürükleyebilirsiniz)"
        >
          <i className="fa-solid fa-sliders text-[10px] opacity-90" aria-hidden></i>
          <span>Analiz</span>
        </button>

        {isPopupOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.16)] p-3 z-10003">
            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wide mb-2">
              Analiz Seçenekleri
            </h4>

            <div className="grid grid-cols-2 gap-1.5">
              {primaryOptions.map(option => {
                const isSelected = selectedOption === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full h-8 rounded-md text-[11px] font-medium border transition-colors ${
                      isSelected
                        ? 'text-white'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                    style={isSelected ? { backgroundColor: getOptionColor(option), borderColor: getOptionColor(option) } : undefined}
                  >
                    {getOptionLabel(option)}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              aria-pressed={isSummarySelected}
              onClick={() => handleOptionSelect('summary')}
              className={`mt-2 w-full h-8 rounded-md text-[11px] font-medium border transition-colors ${
                isSummarySelected
                  ? 'text-white'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
              style={isSummarySelected ? { backgroundColor: getOptionColor('summary'), borderColor: getOptionColor('summary') } : undefined}
            >
              {getOptionLabel('summary')}
            </button>
          </div>
        )}
      </div>

      {showStatsModal && statisticalSummary && (
        <div className="fixed inset-0 z-10004 bg-slate-900/55 backdrop-blur-[3px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_72px_rgba(15,23,42,0.28)] animate-in zoom-in-95 duration-200">
            <div className="relative overflow-hidden border-b border-slate-200 px-6 py-5 bg-slate-50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 text-white shadow-sm">
                      <i className="fa-solid fa-chart-pie text-xs" aria-hidden></i>
                    </span>
                    Etki Analizi İstatistikleri
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Etki alanı analizi sonuçlarını özet ve detay bazında inceleyin.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => setIsStatsModalOpen(false)}
                  className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                >
                  <i className="fa-solid fa-xmark" aria-hidden></i>
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-4 overflow-y-auto max-h-[calc(88vh-104px)] text-sm text-slate-700">
              <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <i className="fa-solid fa-layer-group text-[11px] text-slate-600" aria-hidden></i>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-900">
                    Genel İstatistikler
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Etki Alanı Sayısı</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{statisticalSummary.layerCount}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Toplam Alan</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{formatAreaKm2(statisticalSummary.totalAreaKm2)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Birleşik Alan</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{formatAreaKm2(statisticalSummary.mergedAreaKm2)}</div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] p-4 space-y-2.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-900 flex items-center gap-2">
                    <i className="fa-solid fa-compass-drafting text-[11px] text-slate-600" aria-hidden></i>
                    Yarıçap Analizi
                  </h4>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>Ortalama</span>
                    <strong className="text-slate-900">{formatDistanceKm(statisticalSummary.averageRadiusKm)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>Minimum</span>
                    <strong className="text-slate-900">{formatDistanceKm(statisticalSummary.minRadiusKm)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>Maksimum</span>
                    <strong className="text-slate-900">{formatDistanceKm(statisticalSummary.maxRadiusKm)}</strong>
                  </div>
                </section>

                <section className="rounded-xl border border-rose-200 bg-rose-50/60 shadow-[0_1px_2px_rgba(190,24,93,0.08)] p-3 space-y-1.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-900 flex items-center gap-1.5">
                    <i className="fa-solid fa-link-slash text-[10px] text-rose-600" aria-hidden></i>
                    Çakışma Tespit Edildi
                  </h4>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span>Çakışan Çift</span>
                    <strong className="text-sm text-rose-800">{statisticalSummary.overlapPairCount}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span>Çakışma Oranı</span>
                    <strong className="text-sm text-rose-800">{formatPercent(statisticalSummary.overlapRatioPercent)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span>Çakışma Alanı</span>
                    <strong className="text-sm text-rose-800">{formatAreaHectares(statisticalSummary.overlapAreaHectare)}</strong>
                  </div>
                </section>
              </div>

              <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <i className="fa-solid fa-table-list text-[11px] text-slate-600" aria-hidden></i>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-900">
                    Etki Alanı Detayları
                  </h4>
                </div>

                <div className="overflow-x-auto px-2 pb-2">
                  <table className="w-full min-w-[560px] text-xs">
                    <thead>
                      <tr className="text-slate-600 border-b border-slate-200">
                        <th className="text-left py-3 px-2 font-semibold">İsim</th>
                        <th className="text-left py-3 px-2 font-semibold">Yarıçap</th>
                        <th className="text-left py-3 px-2 font-semibold">Alan</th>
                        <th className="text-left py-3 px-2 font-semibold">Çevre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statisticalSummary.details.map((detail, index) => (
                        <tr
                          key={detail.id}
                          className={`border-t border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-slate-100/70 transition-colors`}
                        >
                          <td className="py-2.5 px-2 text-slate-900 font-medium">{detail.name}</td>
                          <td className="py-2.5 px-2 text-slate-700">{formatDistanceKm(detail.radiusKm)}</td>
                          <td className="py-2.5 px-2 text-slate-700">{formatTableMetric(detail.areaKm2, 'km²')}</td>
                          <td className="py-2.5 px-2 text-slate-700">{formatTableMetric(detail.perimeterKm, 'km')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
