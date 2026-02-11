/**
 * Step3 store bağlama + handler'lar.
 * Step3 bileşeni sadece bu hook + JSX kullanır.
 */

import { useState } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

import { useVizRender } from '../../hooks/useVizRender'
import { useVizSuggestion } from '../../hooks/useVizSuggestion'

export function useVizWizardStep3() {
  const {
    matchResults,
    columnMapping,
    vizSettings,
    setVizSettings,
    colorConfig,
    setColorConfig,
    setCustomRange,
    setLegendConfig,
    mapTitle,
    setMapTitle,
  } = useVisualizationStore()
  const { mapInstance: map } = useMapStore()

  const [showDataPreview, setShowDataPreview] = useState(false)
  const [showLegendConfig, setShowLegendConfig] = useState(false)
  const [showMapTitleConfig, setShowMapTitleConfig] = useState(false)

  const {
    suggestion,
    showSuggestion,
    setShowSuggestion,
    handleApplySuggestion,
  } = useVizSuggestion({
    matchResults,
    dataColumn: columnMapping.dataColumn,
  })

  const { isRendering, hasRendered, handleRender } = useVizRender({
    matchResults,
    columnMapping,
    vizSettings,
    map,
  })

  const dataValues = matchResults.successful
    .map((result) => result.value)
    .filter((v): v is number => v !== undefined && v !== 0)

  const onApplySuggestion = () => {
    handleApplySuggestion((method) => {
      setVizSettings({ classificationMethod: method })
    })
  }

  return {
    matchResults,
    columnMapping,
    vizSettings,
    setVizSettings,
    colorConfig,
    setColorConfig,
    setCustomRange,
    setLegendConfig,
    mapTitle,
    setMapTitle,
    showDataPreview,
    setShowDataPreview,
    showLegendConfig,
    setShowLegendConfig,
    showMapTitleConfig,
    setShowMapTitleConfig,
    suggestion,
    showSuggestion,
    setShowSuggestion,
    onApplySuggestion,
    isRendering,
    hasRendered,
    handleRender,
    dataValues,
  }
}
