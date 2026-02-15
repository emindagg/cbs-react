/**
 * Legend Container
 * Connects DynamicLegend component to visualization store and renders on map.
 * Dot density maps get a specialized "1 nokta = X" legend (ArcGIS style).
 */

import { useMemo } from 'react'

import { DotDensityLegend, DynamicLegend } from '@/components/Legend'
import { getInterpolatedColorPalette } from '@/constants/colorSchemes'
import { Legend } from '@/features/legend-dw'
import { DEFAULT_DOT_COLOR, DEFAULT_DOT_SIZE, calculateSmartDotValue } from '@/features/viz-wizard'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { calculateBreaks } from '@/utils/classification'

export default function Container() {
  const { colorConfig, vizSettings, matchResults, currentVisualization, setLegendConfig } = useVisualizationStore()

  // Extract data values - ALWAYS call hooks before any conditional returns
  const dataValues = useMemo(() => {
    return matchResults.successful
      .map((result) => result.value)
      .filter((v): v is number => v !== undefined)
  }, [matchResults])

  // Calculate breaks based on classification method
  const breaks = useMemo(() => {
    if (dataValues.length === 0) return []

    if (colorConfig.scaleType === 'continuous') {
      // For continuous, use custom range if enabled
      const min = colorConfig.customRange?.enabled && colorConfig.customRange.min !== null
        ? colorConfig.customRange.min
        : Math.min(...dataValues)

      const max = colorConfig.customRange?.enabled && colorConfig.customRange.max !== null
        ? colorConfig.customRange.max
        : Math.max(...dataValues)

      return [min, max]
    } else {
      // For steps: use custom breaks if available, otherwise calculate
      if (vizSettings.classificationMethod === 'custom' && vizSettings.customBreaks?.length) {
        return vizSettings.customBreaks
      }

      // Apply custom range clamp for steps mode too
      let values = dataValues
      if (colorConfig.customRange?.enabled) {
        const rangeMin = colorConfig.customRange.min ?? Math.min(...dataValues)
        const rangeMax = colorConfig.customRange.max ?? Math.max(...dataValues)
        values = dataValues.map((v) => Math.max(rangeMin, Math.min(rangeMax, v)))
      }

      return calculateBreaks(
        values,
        vizSettings.classificationMethod,
        vizSettings.classCount,
      )
    }
  }, [dataValues, colorConfig, vizSettings])

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

  // NOW we can do conditional returns after all hooks are called
  if (!currentVisualization.type || !currentVisualization.data) {
    return null
  }

  if (dataValues.length === 0) {
    return null
  }

  const handleTitleChange = (title: string) => {
    setLegendConfig({
      title: {
        show: colorConfig.legend.title?.show ?? true,
        text: title,
      },
    })
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

  if (colorConfig.legend.orientation === 'vertical') {
    return (
      <Legend
        config={colorConfig.legend}
        breaks={breaks}
        colors={colors}
        scaleType={colorConfig.scaleType}
        onTitleChange={handleTitleChange}
      />
    )
  }

  return (
    <DynamicLegend
      config={colorConfig.legend}
      breaks={breaks}
      colors={colors}
      scaleType={colorConfig.scaleType}
      onTitleChange={handleTitleChange}
    />
  )
}
