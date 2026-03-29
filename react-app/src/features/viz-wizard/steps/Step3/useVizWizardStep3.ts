/**
 * Step3 store bağlama + handler'lar.
 * Step3 bileşeni sadece bu hook + JSX kullanır.
 */

import { useMemo, useState } from 'react'

import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

import { useVizRender } from '../../hooks/useVizRender'
import { useVizSuggestion } from '../../hooks/useVizSuggestion'

export function useVizWizardStep3() {
  const {
    matchResults,
    columnMapping,
    columns,
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
  const [showMapSettings, setShowMapSettings] = useState(false)

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

  // Renderer'ın last-write-wins davranışını yansıt: aynı lokasyon anahtarı için son değeri kullan
  const dataValues = useMemo(() => {
    const seen = new Map<string, number>()
    for (const result of matchResults.successful) {
      if (result.value === undefined) continue
      const key = columnMapping.locationLevel === 'district' && result.province
        ? `${result.province}__${result.location ?? ''}`
        : (result.location ?? String(result.rowIndex))
      seen.set(key, result.value)
    }
    return Array.from(seen.values())
  }, [matchResults.successful, columnMapping.locationLevel])

  const onApplySuggestion = () => {
    handleApplySuggestion((method) => {
      setVizSettings({ classificationMethod: method })
    })
  }

  return {
    matchResults,
    columnMapping,
    columns,
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
    showMapSettings,
    setShowMapSettings,
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
