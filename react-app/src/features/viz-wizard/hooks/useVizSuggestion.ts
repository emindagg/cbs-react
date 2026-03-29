/**
 * Visualization Suggestion Hook
 * Handles classification method suggestion logic
 */

import { useState, useEffect } from 'react'

import type { ClassificationMethod, MatchResults } from '@/types/visualization'
import { suggestClassificationMethod } from '@/utils/dataStats'

interface UseVizSuggestionProps {
  matchResults: MatchResults
  dataColumn: string | null
}

export function useVizSuggestion({ matchResults, dataColumn }: UseVizSuggestionProps) {
  const [suggestion, setSuggestion] = useState<{
    method: ClassificationMethod
    reason: string
    emoji: string
    warning?: string
  } | null>(null)
  const [showSuggestion, setShowSuggestion] = useState(true)

  useEffect(() => {
    if (!matchResults.successful.length || !dataColumn) {
      // Use setTimeout to avoid calling setState synchronously within effect
      setTimeout(() => {
        setSuggestion(null)
      }, 0)
      return
    }

    try {
      // Extract values from successful matches (0 geçerli veri değeridir, yalnızca NaN dışlanır)
      const values = matchResults.successful
        .map((m) => parseFloat(String(m.originalData[dataColumn])))
        .filter((v) => !isNaN(v))

      if (values.length === 0) {
        setTimeout(() => {
          setSuggestion(null)
        }, 0)
        return
      }

      // Get suggestion
      const methodSuggestion = suggestClassificationMethod(values)
      setTimeout(() => {
        setSuggestion(methodSuggestion)
        setShowSuggestion(true)
      }, 0)
    } catch (error) {
      console.error('Suggestion calculation error:', error)
      setTimeout(() => {
        setSuggestion(null)
      }, 0)
    }
  }, [matchResults, dataColumn])

  const handleApplySuggestion = (onApply: (method: ClassificationMethod) => void) => {
    if (suggestion) {
      onApply(suggestion.method)
      setShowSuggestion(false)
    }
  }

  return {
    suggestion,
    showSuggestion,
    setShowSuggestion,
    handleApplySuggestion,
  }
}
