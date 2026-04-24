/**
 * Legend Container
 * Connects DynamicLegend component to visualization store and renders on map.
 */

import { useCallback, useMemo } from 'react'
import * as ss from 'simple-statistics'

import { getInterpolatedColorPalette } from '@/constants/colorSchemes'
import { BUBBLE_DEFAULT_FILL_COLOR, DEFAULT_DOT_COLOR, DEFAULT_DOT_SIZE, calculateSmartDotValue } from '@/shared/visualization'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { calculateBreaks } from '@/utils/classification'
import { parseFormattedNumber } from '@/utils/numberFormatter'
import { calculateSymbolSize } from '@/utils/symbolShapes'
import { normalizeTurkishText } from '@/utils/turkishNormalizer'

import BubbleSizeLegend from './BubbleSizeLegend'
import ColorLegend from './ColorLegend'
import DotDensityLegend from './DotDensityLegend'
import DynamicLegend from './DynamicLegend'

export default function Container() {
  const { colorConfig, vizSettings, matchResults, currentVisualization, setLegendConfig } = useVisualizationStore()

  // Legend aktif render'dan beslenmeli, draft wizard state'inden değil.
  // renderSettings null ise (ilk render öncesi) vizSettings fallback olur.
  const rs = currentVisualization.renderSettings ?? vizSettings

  // Legend min/max must be computed on the SAME deduplicated value set that
  // BubbleRenderer.createDataMap produces, otherwise the bubble radii scale
  // the map uses (min/max of the deduped dataMap) diverges from the scale the
  // legend draws (min/max of the snapshot). Mirror createDataMap's key logic
  // exactly: normalize Turkish text, prefer `_province` (mixed mode) over the
  // top-level `province` (set by useVizRender for all successful matches), and
  // use the same underscore-separated composite key for district level.
  const extractSnapshotValues = useCallback((
    data: Record<string, unknown>[],
    col: string,
    locationLevel: 'province' | 'district' | null,
  ): number[] => {
    const seen = new Map<string, number>()
    for (const row of data) {
      const v = parseFormattedNumber(String(row[col]))
      if (v === null) continue
      const locationName = row.location ?? Object.values(row)[0]
      if (!locationName) continue
      const normalizedKey = normalizeTurkishText(String(locationName))
      const provinceName = row._province ?? row.province
      let key = normalizedKey
      if (locationLevel === 'district' && provinceName) {
        const provinceNormalized = normalizeTurkishText(String(provinceName))
        key = `${provinceNormalized}_${normalizedKey}`
      }
      seen.set(key, v)
    }
    return Array.from(seen.values())
  }, [])

  // Legend, canlı matchResults yerine render anındaki snapshot'tan beslenmeli.
  // currentVisualization.data null ise (render öncesi) matchResults fallback olur.
  const dataValues = useMemo(() => {
    const snapshotData = currentVisualization.data
    const col = currentVisualization.column
    if (snapshotData && col) {
      return extractSnapshotValues(snapshotData, col, currentVisualization.locationLevel)
    }
    return matchResults.successful
      .map((result) => result.value)
      .filter((v): v is number => v !== undefined)
  }, [currentVisualization.data, currentVisualization.column, currentVisualization.locationLevel, matchResults.successful, extractSnapshotValues])

  // Bivariate modda renk lejantı colorColumn snapshot'ından hesaplanmalı
  const colorValues = useMemo(() => {
    const snapshotData = currentVisualization.data
    if (rs.colorColumn && snapshotData) {
      const vals = extractSnapshotValues(snapshotData, rs.colorColumn, currentVisualization.locationLevel)
      if (vals.length > 0) return vals
    }
    return dataValues
  }, [currentVisualization.data, currentVisualization.locationLevel, rs.colorColumn, dataValues, extractSnapshotValues])

  // Calculate breaks based on classification method
  const breaks = useMemo(() => {
    if (colorValues.length === 0) return []

    if (colorConfig.scaleType === 'continuous') {
      // For continuous, use custom range if enabled
      const min = colorConfig.customRange?.enabled && colorConfig.customRange.min !== null
        ? colorConfig.customRange.min
        : Math.min(...colorValues)

      const max = colorConfig.customRange?.enabled && colorConfig.customRange.max !== null
        ? colorConfig.customRange.max
        : Math.max(...colorValues)

      return [min, max]
    } else {
      // For steps: use custom breaks if available, otherwise calculate
      if (rs.classificationMethod === 'custom' && rs.customBreaks?.length) {
        return rs.customBreaks
      }

      // Apply custom range clamp for steps mode too
      let values = colorValues
      if (colorConfig.customRange?.enabled) {
        const rangeMin = colorConfig.customRange.min ?? Math.min(...colorValues)
        const rangeMax = colorConfig.customRange.max ?? Math.max(...colorValues)
        values = colorValues.map((v) => Math.max(rangeMin, Math.min(rangeMax, v)))
      }

      return calculateBreaks(
        values,
        rs.classificationMethod,
        rs.classCount,
      )
    }
  }, [colorValues, colorConfig, rs])

  // Get colors based on scale type
  const colors = useMemo(() => {
    if (colorConfig.scaleType === 'continuous') {
      // For continuous, generate smooth gradient
      return getInterpolatedColorPalette(rs.colorScheme, 30, 'lab')
    } else {
      // For steps, get discrete colors — use custom breaks count if available
      const count = rs.classificationMethod === 'custom' && rs.customBreaks?.length
        ? rs.customBreaks.length - 1
        : rs.classCount
      return getInterpolatedColorPalette(rs.colorScheme, count, 'lab')
    }
  }, [colorConfig.scaleType, rs.colorScheme, rs.classCount, rs.classificationMethod, rs.customBreaks])

  // Derived values needed by hooks below
  const isBubble = rs.type === 'bubble'
  const isBubbleBivariate = isBubble && !!rs.colorColumn

  // Hooks must all be declared before any conditional returns
  const handleTitleChange = useCallback((title: string) => {
    setLegendConfig({
      title: {
        show: colorConfig.legend.title?.show ?? true,
        text: title,
      },
    })
  }, [colorConfig.legend.title?.show, setLegendConfig])

  // Bivariate modda boyut lejantı başlığı bağımsız olarak güncellenir
  const handleSizeTitleChange = useCallback((title: string) => {
    setLegendConfig({ sizeLegendTitle: title })
  }, [setLegendConfig])

  const bubbleSizeLegend = useMemo(() => {
    if (!isBubble || dataValues.length === 0) return null

    const minVal = Math.min(...dataValues)
    const maxVal = Math.max(...dataValues)
    const minSize = rs.symbolMinSize || 5
    const maxSize = rs.symbolMaxSize || 20
    const scaling = rs.symbolScaling || 'sqrt'

    // Graduated mode: compute class info for the legend
    const isGraduated = rs.bubbleSizeMode === 'graduated'
    const graduatedClasses = isGraduated ? (() => {
      const sizeBreaks = calculateBreaks(dataValues, rs.classificationMethod, rs.classCount)
      const classCount = sizeBreaks.length - 1

      // Standard Deviation labels logic
      const isStdDev = rs.classificationMethod === 'stddev'
      const mean = isStdDev ? ss.mean(dataValues) : 0
      const stdDev = isStdDev ? ss.standardDeviation(dataValues) : 1
      const minDataVal = Math.min(...dataValues)
      const maxDataVal = Math.max(...dataValues)

      return Array.from({ length: classCount }, (_, i) => {
        const minVal = sizeBreaks[i]
        const maxVal = sizeBreaks[i + 1]

        let label: string | undefined
        if (isStdDev && stdDev > 0) {
          const zMin = ((minVal - mean) / stdDev).toFixed(1)
          const zMax = ((maxVal - mean) / stdDev).toFixed(1)
          const isLowest = minVal === minDataVal
          const isHighest = maxVal === maxDataVal

          const zMinNum = parseFloat(zMin)
          const zMaxNum = parseFloat(zMax)

          if (isLowest && !isHighest) {
            label = '< -0.5 Std. S. (Çok Düşük)'
          } else if (isHighest && !isLowest) {
            label = '> 1.5 Std. S. (Çok Yüksek)'
          } else {
            // Check inner ranges to apply specific labels
             
            if (zMinNum >= 0.5 && zMaxNum <= 1.5) {
              label = '0.5 - 1.5 Std. S. (Yüksek)'
            // eslint-disable-next-line no-magic-numbers
            } else if (zMinNum >= -0.5 && zMaxNum <= 0.5) {
              label = '-0.5 - 0.5 Std. S. (Ortalama)'
            // eslint-disable-next-line no-magic-numbers
            } else if (zMinNum >= -1.5 && zMaxNum <= -0.5) {
              label = '-1.5 - -0.5 Std. S. (Düşük)'
            } else {
              // Fallback if bounds change
              label = `${zMin} - ${zMax} Std. S.`
            }
          }
        }

        return {
          minVal,
          maxVal,
          label,
          radius: classCount <= 1
            ? (minSize + maxSize) / 2
            : minSize + (i / (classCount - 1)) * (maxSize - minSize),
        }
      })
    })() : undefined

    // Proportional mode: dinamik çember sayısı (3-7), max→min sıralı
    const count = 5
    const legendCircles = Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1)  // 0→1
      const value = maxVal - t * (maxVal - minVal)     // maxVal→minVal
      const radius = calculateSymbolSize(value, minVal, maxVal, minSize, maxSize, scaling)
      return { value, radius }
    })

    // maxRadius graduated için de gerekli (SVG genişliği hesabı)
    const maxR = calculateSymbolSize(maxVal, minVal, maxVal, minSize, maxSize, scaling)
    const graduatedMaxR = graduatedClasses
      ? Math.max(...graduatedClasses.map((c) => c.radius))
      : maxR
    const circlesForGraduated = [{ value: maxVal, radius: graduatedMaxR }]

    // Bivariate modda boyut başlığı sizeLegendTitle'dan, renk başlığı legend.title'dan bağımsız okunur
    const sizeTitle = isBubbleBivariate
      ? (colorConfig.legend.sizeLegendTitle ?? 'Boyut')
      : (colorConfig.legend.title?.text || 'Lejant')

    return (
      <BubbleSizeLegend
        config={{
          ...colorConfig.legend,
          title: {
            ...colorConfig.legend.title,
            show: colorConfig.legend.title?.show ?? true,
            text: sizeTitle,
          },
        }}
        circles={isGraduated ? circlesForGraduated : legendCircles}
        bubbleColor={!rs.colorColumn ? (rs.symbolFillColor || BUBBLE_DEFAULT_FILL_COLOR) : undefined}
        bubbleOpacity={rs.symbolOpacity ?? 0.6}
        bubbleStrokeColor={rs.symbolStrokeColor || '#ffffff'}
        bubbleStrokeWidth={rs.symbolStrokeWidth ?? 0.5}
        graduatedClasses={graduatedClasses}
        onTitleChange={isBubbleBivariate ? handleSizeTitleChange : handleTitleChange}
      />
    )
  }, [isBubble, isBubbleBivariate, dataValues, rs, colorConfig.legend, handleTitleChange, handleSizeTitleChange])

  // NOW we can do conditional returns after all hooks are called
  if (!currentVisualization.type || !currentVisualization.data) {
    return null
  }

  if (dataValues.length === 0) {
    return null
  }

  // Dot density → "1 nokta = X" legend
  if (rs.type === 'dot') {
    const dotValue = rs.dotValue ?? calculateSmartDotValue(dataValues)
    const dotColor = rs.dotColor ?? DEFAULT_DOT_COLOR
    const dotSize = rs.dotSize ?? DEFAULT_DOT_SIZE

    return (
      <DotDensityLegend
        config={colorConfig.legend}
        dotColor={dotColor}
        dotSize={dotSize}
        dotValue={dotValue}
        dotLabel={rs.dotLabel}
        onTitleChange={handleTitleChange}
      />
    )
  }

  // Proportional + non-bivariate: only show size legend (no color gradient legend)
  const isProportionalNonBivariate = isBubble
    && (rs.bubbleSizeMode || 'proportional') === 'proportional'
    && !rs.colorColumn

  if (isProportionalNonBivariate) {
    return <>{bubbleSizeLegend}</>
  }

  // Graduated + non-bivariate: only show size legend (color legend is redundant)
  const isGraduatedNonBivariate = isBubble
    && rs.bubbleSizeMode === 'graduated'
    && !rs.colorColumn

  if (isGraduatedNonBivariate) {
    return <>{bubbleSizeLegend}</>
  }

  // Bivariate modda renk lejantı "Renk", boyut lejantı "Boyut" varsayılan başlığını almalı
  const colorLegendConfig = isBubbleBivariate
    ? {
      ...colorConfig.legend,
      title: {
        ...colorConfig.legend.title,
        show: colorConfig.legend.title?.show ?? true,
        text: colorConfig.legend.title?.text || 'Renk',
      },
    }
    : colorConfig.legend

  const colorFillOpacity = rs.choroplethOpacity ?? 1

  if (colorConfig.legend.orientation === 'vertical') {
    return (
      <>
        <ColorLegend
          config={colorLegendConfig}
          breaks={breaks}
          colors={colors}
          scaleType={colorConfig.scaleType}
          classificationMethod={rs.classificationMethod}
          onTitleChange={handleTitleChange}
          fillOpacity={colorFillOpacity}
        />
        {bubbleSizeLegend}
      </>
    )
  }

  return (
    <>
      <DynamicLegend
        config={colorLegendConfig}
        breaks={breaks}
        colors={colors}
        scaleType={colorConfig.scaleType}
        classificationMethod={rs.classificationMethod}
        onTitleChange={handleTitleChange}
        fillOpacity={colorFillOpacity}
      />
      {bubbleSizeLegend}
    </>
  )
}
