import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useVisualizationStore } from '@/stores/useVisualizationStore'

import Container from './Container'

vi.mock('./BubbleSizeLegend', () => ({
  default: () => <div data-testid="bubble-legend">bubble legend</div>,
}))

vi.mock('./ColorLegend', () => ({
  default: () => <div data-testid="color-legend">color legend</div>,
}))

vi.mock('./DotDensityLegend', () => ({
  default: () => <div data-testid="dot-legend">dot legend</div>,
}))

vi.mock('./DynamicLegend', () => ({
  default: () => <div data-testid="dynamic-legend">dynamic legend</div>,
}))

describe('Legend Container regressions', () => {
  beforeEach(() => {
    useVisualizationStore.getState().reset()
  })

  it('renders the active visualization legend instead of the draft wizard type', () => {
    useVisualizationStore.setState({
      currentVisualization: {
        type: 'choropleth',
        data: [{ city: 'Ankara', value: 10 }],
        column: 'value',
        locationLevel: 'province',
        renderSettings: {
          type: 'choropleth',
          classCount: 5,
          classificationMethod: 'jenks',
          colorScheme: 'teal',
          legendType: 'discrete',
        },
      },
      matchResults: {
        successful: [
          {
            rowIndex: 0,
            matched: true,
            ambiguous: false,
            location: 'Ankara',
            value: 10,
            originalData: { city: 'Ankara', value: 10 },
          },
        ],
        ambiguous: [],
        failed: [],
      },
      vizSettings: {
        ...useVisualizationStore.getState().vizSettings,
        type: 'dot',
      },
    })

    render(<Container />)

    expect(screen.getByTestId('dynamic-legend')).toBeInTheDocument()
    expect(screen.queryByTestId('dot-legend')).not.toBeInTheDocument()
  })
})
