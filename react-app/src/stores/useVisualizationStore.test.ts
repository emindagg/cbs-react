import { beforeEach, describe, expect, it } from 'vitest'

import { useVisualizationStore } from './useVisualizationStore'

describe('useVisualizationStore class-count guards', () => {
  beforeEach(() => {
    useVisualizationStore.getState().reset()
  })

  it('clamps classCount into 3-7 range', () => {
    useVisualizationStore.getState().setVizSettings({ classCount: 9 })
    expect(useVisualizationStore.getState().vizSettings.classCount).toBe(7)

    useVisualizationStore.getState().setVizSettings({ classCount: 2 })
    expect(useVisualizationStore.getState().vizSettings.classCount).toBe(3)
  })

  it('clamps bubbleLegendCount into 3-7 range', () => {
    useVisualizationStore.getState().setVizSettings({ bubbleLegendCount: 9 })
    expect(useVisualizationStore.getState().vizSettings.bubbleLegendCount).toBe(7)

    useVisualizationStore.getState().setVizSettings({ bubbleLegendCount: 2 })
    expect(useVisualizationStore.getState().vizSettings.bubbleLegendCount).toBe(3)
  })

  it('syncs classCount from valid customBreaks and ignores invalid lengths', () => {
    useVisualizationStore.getState().setVizSettings({ customBreaks: [0, 10, 20, 30] })
    expect(useVisualizationStore.getState().vizSettings.customBreaks).toEqual([0, 10, 20, 30])
    expect(useVisualizationStore.getState().vizSettings.classCount).toBe(3)

    useVisualizationStore.getState().setVizSettings({ customBreaks: [0, 1, 2] })
    expect(useVisualizationStore.getState().vizSettings.customBreaks).toEqual([0, 10, 20, 30])
    expect(useVisualizationStore.getState().vizSettings.classCount).toBe(3)
  })
})

