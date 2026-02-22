import * as turf from '@turf/turf'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useDataManagementStore } from '../../data-management/store/useDataManagementStore'
import type { DataItem } from '../../data-management/types'
import { BUFFER_MODE_COLORS } from './GISToolsControl.bufferColors'

type BufferOption = 'normal' | 'combined' | 'intersection' | 'difference' | 'summary'
type DerivedBufferType = 'combined' | 'intersection' | 'difference'

interface BufferOptionsControlProps {
  hasBufferResults: boolean
}

const BUFFER_ANALYSIS_TAG = 'buffer'

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

/** Tek katmanı tek Polygon/MultiPolygon Feature yapar; MultiPolygon ise parçaları birleştirip döner. */
function toSinglePolygonFeature(item: DataItem): Feature<Polygon | MultiPolygon> | null {
  const geometry = item.geometry
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return turf.feature(geometry) as Feature<Polygon | MultiPolygon>
  }

  const flattened = toPolygonFeatures([item])
  if (flattened.length === 0) return null
  if (flattened.length === 1) return flattened[0]

  try {
    const unioned = turf.union(turf.featureCollection(flattened)) as Feature<Polygon | MultiPolygon> | null
    if (!unioned) return null
    return unioned as Feature<Polygon | MultiPolygon>
  } catch {
    return null
  }
}

/** Kesişim/fark için geometriyi normalize eder: rewind (yön) + gerekirse tek Polygon. */
function normalizeForOverlay(f: Feature<Polygon | MultiPolygon>): Feature<Polygon | MultiPolygon> | null {
  try {
    const rewound = turf.rewind(f, { reverse: false })
    if (!rewound?.geometry) return null
    const geom = rewound.geometry
    if (geom.type === 'MultiPolygon' && geom.coordinates.length > 1) {
      const flattened = turf.flatten(rewound)
      const polys = (flattened as FeatureCollection<Polygon>).features.filter(
        feat => feat.geometry.type === 'Polygon'
      ) as Feature<Polygon>[]
      if (polys.length === 0) return rewound as Feature<Polygon | MultiPolygon>
      if (polys.length === 1) return polys[0]
      const unioned = turf.union(turf.featureCollection(polys)) as Feature<Polygon | MultiPolygon> | null
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

  const statisticalSummary = useMemo(() => {
    if (selectedOption !== 'summary') return null

    const visibleBufferItems = bufferItems.filter(item => item.visible)
    const targetItems = visibleBufferItems.length > 0 ? visibleBufferItems : bufferItems
    if (targetItems.length === 0) return null

    const areas = targetItems.map(item => turf.area(turf.feature(item.geometry)))
    if (areas.length === 0) return null

    const totalArea = areas.reduce((sum, area) => sum + area, 0)
    const averageArea = totalArea / areas.length
    const minArea = Math.min(...areas)
    const maxArea = Math.max(...areas)

    return {
      layerCount: targetItems.length,
      totalArea,
      averageArea,
      minArea,
      maxArea,
    }
  }, [bufferItems, selectedOption])

  useEffect(() => {
    if (!hasBufferResults) {
      setIsPopupOpen(false)
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
    setSelectedOption('summary')
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

  const wrapperStyle: React.CSSProperties = dragPosition
    ? { position: 'fixed', left: dragPosition.x, top: dragPosition.y, zIndex: 10003 }
    : undefined

  return (
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

          {statisticalSummary && (
            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-[10px] text-zinc-700 space-y-1">
              <p><strong>Katman:</strong> {statisticalSummary.layerCount}</p>
              <p><strong>Toplam Alan (m²):</strong> {formatNumber(statisticalSummary.totalArea)}</p>
              <p><strong>Ortalama Alan (m²):</strong> {formatNumber(statisticalSummary.averageArea)}</p>
              <p><strong>Min Alan (m²):</strong> {formatNumber(statisticalSummary.minArea)}</p>
              <p><strong>Max Alan (m²):</strong> {formatNumber(statisticalSummary.maxArea)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
