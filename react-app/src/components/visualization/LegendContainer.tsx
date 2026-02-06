/**
 * Legend Container
 * Connects Legend component to visualization store and renders on map
 */

import { useMemo } from 'react'

import { getInterpolatedColorPalette } from '../../constants/colorSchemes'
import { useVisualizationStore } from '../../stores/useVisualizationStore'
import { calculateBreaks } from '../../utils/classificationMethods'
import Legend from './Legend'

export default function LegendContainer() {
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
      // For steps, calculate breaks
      return calculateBreaks(
        dataValues,
        vizSettings.classificationMethod,
        vizSettings.classCount,
        vizSettings.customBreaks,
      )
    }
  }, [dataValues, colorConfig, vizSettings])

  // Get colors based on scale type
  const colors = useMemo(() => {
    if (colorConfig.scaleType === 'continuous') {
      // For continuous, generate smooth gradient
      return getInterpolatedColorPalette(vizSettings.colorScheme, 30, 'lab')
    } else {
      // For steps, get discrete colors
      return getInterpolatedColorPalette(vizSettings.colorScheme, vizSettings.classCount, 'lab')
    }
  }, [colorConfig.scaleType, vizSettings.colorScheme, vizSettings.classCount])

  // NOW we can do conditional returns after all hooks are called
  if (!currentVisualization.type || !currentVisualization.data) {
    return null
  }

  if (dataValues.length === 0) {
    return null
  }

  return (
    <Legend
      config={colorConfig.legend}
      breaks={breaks}
      colors={colors}
      scaleType={colorConfig.scaleType}
      onTitleChange={(title) => {
        setLegendConfig({
          title: {
            show: colorConfig.legend.title?.show ?? true,
            text: title,
          },
        })
      }}
    />
  )
}
