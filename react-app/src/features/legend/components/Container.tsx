/**
 * Legend Container
 * Connects DynamicLegend component to visualization store and renders on map.
 * Dot density maps get a specialized "1 nokta = X" legend (ArcGIS style).
 */

import { useCallback, useMemo } from 'react'

import { getInterpolatedColorPalette } from '@/constants/colorSchemes'
import { DEFAULT_DOT_COLOR, DEFAULT_DOT_SIZE, calculateSmartDotValue } from '@/shared/visualization'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { calculateBreaks } from '@/utils/classification'
import { calculateSymbolSize } from '@/utils/symbolShapes'

import BubbleSizeLegend from './BubbleSizeLegend'
import DatawrapperLegend from './DatawrapperLegend'
import DotDensityLegend from './DotDensityLegend'
import DynamicLegend from './DynamicLegend'

export default function Container() {
  const { colorConfig, vizSettings, matchResults, currentVisualization, setLegendConfig } = useVisualizationStore()

  // Extract data values - ALWAYS call hooks before any conditional returns
  const dataValues = useMemo(() => {
    return matchResults.successful
      .map((result) => result.value)
      .filter((v): v is number => v !== undefined)
  }, [matchResults])

  // Bivariate modda renk lejantı colorColumn'dan hesaplanmalı
  const colorValues = useMemo(() => {
    if (vizSettings.colorColumn) {
      const vals = matchResults.successful
        .map((result) => parseFloat(String(result.originalData[vizSettings.colorColumn!])))
        .filter((v) => !isNaN(v) && v !== 0)
      if (vals.length > 0) return vals
    }
    return dataValues
  }, [matchResults, vizSettings.colorColumn, dataValues])

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
      if (vizSettings.classificationMethod === 'custom' && vizSettings.customBreaks?.length) {
        return vizSettings.customBreaks
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
        vizSettings.classificationMethod,
        vizSettings.classCount,
      )
    }
  }, [colorValues, colorConfig, vizSettings])

  // Get colors based on scale type
  const colors = useMemo(() => {
    if (colorConfig.scaleType === 'continuous') {
      // For continuous, generate smooth gradient
      return getInterpolatedColorPalette(vizSettings.colorScheme, 30, 'lab')
    } else {
      // For steps, get discrete colors — use custom breaks count if available
      const count = vizSettings.classificationMethod === 'custom' && vizSettings.customBreaks?.length
        ? vizSettings.customBreaks.length - 1
        : vizSettings.classCount
      return getInterpolatedColorPalette(vizSettings.colorScheme, count, 'lab')
    }
  }, [colorConfig.scaleType, vizSettings.colorScheme, vizSettings.classCount, vizSettings.classificationMethod, vizSettings.customBreaks])

  // Derived values needed by hooks below
  const isBubble = vizSettings.type === 'bubble'
  const isBubbleBivariate = isBubble && !!vizSettings.colorColumn

  // Hooks must all be declared before any conditional returns
  const handleTitleChange = useCallback((title: string) => {
    setLegendConfig({
      title: {
        show: colorConfig.legend.title?.show ?? true,
        text: title,
      },
    })
  }, [colorConfig.legend.title?.show, setLegendConfig])

  const bubbleSizeLegend = useMemo(() => {
    if (!isBubble || dataValues.length === 0) return null

    const minVal = Math.min(...dataValues)
    const maxVal = Math.max(...dataValues)
    const minSize = vizSettings.symbolMinSize || 5
    const maxSize = vizSettings.symbolMaxSize || 40
    const scaling = vizSettings.symbolScaling || 'sqrt'

    // Graduated mode: compute class info for the legend
    const isGraduated = vizSettings.bubbleSizeMode === 'graduated'
    const graduatedClasses = isGraduated ? (() => {
      const sizeBreaks = calculateBreaks(dataValues, vizSettings.classificationMethod, vizSettings.classCount)
      const classCount = sizeBreaks.length - 1
      return Array.from({ length: classCount }, (_, i) => ({
        minVal: sizeBreaks[i],
        maxVal: sizeBreaks[i + 1],
        radius: classCount <= 1
          ? (minSize + maxSize) / 2
          : minSize + (i / (classCount - 1)) * (maxSize - minSize),
      }))
    })() : undefined

    // Proportional mode: dinamik çember sayısı (3-7), max→min sıralı
    const count = vizSettings.bubbleLegendCount || 3
    const legendCircles = Array.from({ length: count }, (_, i) => {
      const t = count === 1 ? 0.5 : i / (count - 1)  // 0→1
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

    return (
      <BubbleSizeLegend
        config={{
          ...colorConfig.legend,
          title: {
            ...colorConfig.legend.title,
            show: colorConfig.legend.title?.show ?? true,
            text: colorConfig.legend.title?.text || (isBubbleBivariate ? 'Boyut' : 'Lejant'),
          },
        }}
        circles={isGraduated ? circlesForGraduated : legendCircles}
        bubbleColor={!isGraduated && !vizSettings.colorColumn ? vizSettings.symbolFillColor : undefined}
        bubbleOpacity={vizSettings.symbolOpacity ?? 0.6}
        bubbleStrokeColor={vizSettings.symbolStrokeColor || '#ffffff'}
        bubbleStrokeWidth={vizSettings.symbolStrokeWidth ?? 1.5}
        graduatedClasses={graduatedClasses}
        onTitleChange={handleTitleChange}
      />
    )
  }, [isBubble, isBubbleBivariate, dataValues, vizSettings, colorConfig.legend, handleTitleChange])

  // NOW we can do conditional returns after all hooks are called
  if (!currentVisualization.type || !currentVisualization.data) {
    return null
  }

  if (dataValues.length === 0) {
    return null
  }

  // Dot density → ArcGIS-style "1 nokta = X" legend
  if (vizSettings.type === 'dot') {
    const dotValue = vizSettings.dotValue ?? calculateSmartDotValue(dataValues)
    const dotColor = vizSettings.dotColor ?? DEFAULT_DOT_COLOR
    const dotSize = vizSettings.dotSize ?? DEFAULT_DOT_SIZE

    return (
      <DotDensityLegend
        config={colorConfig.legend}
        dotColor={dotColor}
        dotSize={dotSize}
        dotValue={dotValue}
        onTitleChange={handleTitleChange}
      />
    )
  }

  // Proportional + non-bivariate: only show size legend (no color gradient legend)
  const isProportionalNonBivariate = isBubble
    && (vizSettings.bubbleSizeMode || 'proportional') === 'proportional'
    && !vizSettings.colorColumn

  if (isProportionalNonBivariate) {
    return <>{bubbleSizeLegend}</>
  }

  // Graduated + non-bivariate: only show size legend (color legend is redundant)
  const isGraduatedNonBivariate = isBubble
    && vizSettings.bubbleSizeMode === 'graduated'
    && !vizSettings.colorColumn

  if (isGraduatedNonBivariate) {
    return <>{bubbleSizeLegend}</>
  }

  if (colorConfig.legend.orientation === 'vertical') {
    return (
      <>
        <DatawrapperLegend
          config={colorConfig.legend}
          breaks={breaks}
          colors={colors}
          scaleType={colorConfig.scaleType}
          onTitleChange={handleTitleChange}
        />
        {bubbleSizeLegend}
      </>
    )
  }

  return (
    <>
      <DynamicLegend
        config={colorConfig.legend}
        breaks={breaks}
        colors={colors}
        scaleType={colorConfig.scaleType}
        onTitleChange={handleTitleChange}
      />
      {bubbleSizeLegend}
    </>
  )
}
