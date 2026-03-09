import * as turf from '@turf/turf'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { BUFFER_MODE_COLORS } from './GISToolsControl.bufferColors'
import { useDataManagementStore, type DataItem } from '../../data-management'


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
    const rewound = turf.rewind(f, { reverse: false }) as Feature<Polygon | MultiPolygon>
    if (!rewound?.geometry) return null

    const geometry = rewound.geometry
    if (geometry.type === 'MultiPolygon' && geometry.coordinates.length > 1) {
      const flattened = turf.flatten(rewound)
      const polygons = (flattened as FeatureCollection<Polygon>).features.filter(
        feature => feature.geometry.type === 'Polygon',
      ) as Feature<Polygon>[]
      if (polygons.length === 0) return rewound
      if (polygons.length === 1) return polygons[0]

      const unioned = turf.union(turf.featureCollection(polygons)) as Feature<Polygon | MultiPolygon> | null
      return unioned ?? rewound
    }

    return rewound
  } catch {
    return null
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value)
}

function formatDistanceKm(value: number | null): string {
  return value === null ? '-' : `${value.toFixed(2)} km`
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
    if (fromMeta !== null) return fromMeta
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
      .filter((radius): radius is number => radius !== null && radius !== undefined && Number.isFinite(radius))

    const averageRadiusKm = radiusValues.length > 0
      ? radiusValues.reduce((sum, radius) => sum + radius, 0) / radiusValues.length
      : null
    const minRadiusKm = radiusValues.length > 0 ? Math.min(...radiusValues) : null
    const maxRadiusKm = radiusValues.length > 0 ? Math.max(...radiusValues) : null

    const normalizedFeatures = detailSegments
      .map(detail => detail.feature)
      .map(normalizeForOverlay)
      .filter((feature): feature is Feature<Polygon | MultiPolygon> => feature !== null && feature !== undefined)

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
      setDragPosition(null)
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
      if (
        Math.abs(e.clientX - start.startX) > DRAG_THRESHOLD ||
        Math.abs(e.clientY - start.startY) > DRAG_THRESHOLD
      ) {
        didDragRef.current = true
      }
      setDragPosition({ x: e.clientX - start.offsetX, y: e.clientY - start.offsetY })
    }
    const onUp = () => { dragStartRef.current = null }
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
      .filter((f): f is Feature<Polygon | MultiPolygon> => f !== null && f !== undefined)

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
  const showStatsModal = isStatsModalOpen && statisticalSummary !== null && statisticalSummary !== undefined

  const wrapperStyle: React.CSSProperties = dragPosition
    ? { position: 'fixed', left: dragPosition.x, top: dragPosition.y, zIndex: 10003 }
    : { position: 'fixed', top: 12, right: 56, zIndex: 10003 }

  return (
    <>
      <div
        ref={popupRef}
        className="relative"
        style={wrapperStyle}
      >
        <button
          type="button"
          onMouseDown={handlePointerDown}
          onClick={handleClick}
          className="relative flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-semibold text-white bg-zinc-900 hover:bg-black rounded-md shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_15px_rgba(0,0,0,0.15)] active:scale-95 transition-all duration-200 overflow-hidden cursor-grab active:cursor-grabbing"
          title="Analiz seçenekleri (sürükleyebilirsiniz)"
        >
          <Zap size={13} className="text-purple-400" />
          <span>Analiz</span>
        </button>

        {isPopupOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)] p-2.5 z-10003">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest px-1 mb-2">
              Analiz Modu
            </p>

            <div className="grid grid-cols-2 gap-1">
              {primaryOptions.map(option => {
                const isSelected = selectedOption === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full h-7 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'bg-zinc-50 border border-zinc-200/70 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                    }`}
                  >
                    {getOptionLabel(option)}
                  </button>
                )
              })}
            </div>

            <div className="my-2 border-t border-zinc-100" />

            <button
              type="button"
              aria-pressed={isSummarySelected}
              onClick={() => handleOptionSelect('summary')}
              className={`w-full h-7 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                isSummarySelected
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-50 border border-zinc-200/70 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
              }`}
            >
              {getOptionLabel('summary')}
            </button>
          </div>
        )}
      </div>

      {showStatsModal && statisticalSummary && (
        <div className="fixed inset-0 z-10004 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg flex flex-col max-h-[82vh] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-150 bg-white border border-zinc-200/80 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_20px_60px_rgba(0,0,0,0.10)]">

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 shrink-0 border-b border-zinc-100">
              <span className="flex-1 text-[13px] font-semibold text-zinc-900 tracking-[-0.02em]">
                Etki Analizi İstatistikleri
              </span>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setIsStatsModalOpen(false)}
                className="h-6 w-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <i className="fa-solid fa-xmark text-[11px]" aria-hidden></i>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e4e4e7 transparent' }}>

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Etki Alanı', value: String(statisticalSummary.layerCount), large: true },
                  { label: 'Toplam Alan', value: formatAreaKm2(statisticalSummary.totalAreaKm2), large: false },
                  { label: 'Birleşik Alan', value: formatAreaKm2(statisticalSummary.mergedAreaKm2), large: false },
                ].map(({ label, value, large }) => (
                  <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-3.5 py-3">
                    <div className={`font-semibold tabular-nums leading-none text-zinc-900 ${large ? 'text-2xl' : 'text-[13px]'}`}>
                      {value}
                    </div>
                    <div className="text-[10.5px] text-zinc-400 mt-1.5 font-medium">{label}</div>
                  </div>
                ))}
              </div>

              {/* Yarıçap + Çakışma */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 space-y-2.5">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 pb-2">
                    Yarıçap
                  </p>
                  {(
                    [
                      ['Ort.', formatDistanceKm(statisticalSummary.averageRadiusKm)],
                      ['Min', formatDistanceKm(statisticalSummary.minRadiusKm)],
                      ['Max', formatDistanceKm(statisticalSummary.maxRadiusKm)],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">{label}</span>
                      <span className="text-[11px] font-semibold text-zinc-800 tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 space-y-2.5">
                  <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest border-b border-red-200 pb-2">
                    Çakışma
                  </p>
                  {(
                    [
                      ['Çift', String(statisticalSummary.overlapPairCount)],
                      ['Oran', formatPercent(statisticalSummary.overlapRatioPercent)],
                      ['Alan', formatAreaHectares(statisticalSummary.overlapAreaHectare)],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[11px] text-red-400">{label}</span>
                      <span className="text-[11px] font-semibold text-red-600 tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-zinc-100 overflow-hidden">
                <div className="px-3.5 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest bg-zinc-50/80 border-b border-zinc-100">
                  Detaylar
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        {['İsim', 'Yarıçap', 'Alan', 'Çevre'].map((h, i) => (
                          <th
                            key={h}
                            className={`py-2 px-3.5 text-[10px] font-semibold text-zinc-400 ${i === 0 ? 'text-left' : 'text-right'}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {statisticalSummary.details.map((detail, index) => (
                        <tr
                          key={detail.id}
                          className={`border-t border-zinc-50 transition-colors hover:bg-violet-50/50 ${index % 2 !== 0 ? 'bg-zinc-50/40' : 'bg-white'}`}
                        >
                          <td className="py-2.5 px-3.5 text-[11px] font-medium text-zinc-800">{detail.name}</td>
                          <td className="py-2.5 px-3.5 text-[11px] text-right tabular-nums text-zinc-500">{formatDistanceKm(detail.radiusKm)}</td>
                          <td className="py-2.5 px-3.5 text-[11px] text-right tabular-nums text-zinc-500">{formatTableMetric(detail.areaKm2, 'km²')}</td>
                          <td className="py-2.5 px-3.5 text-[11px] text-right tabular-nums text-zinc-500">{formatTableMetric(detail.perimeterKm, 'km')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
