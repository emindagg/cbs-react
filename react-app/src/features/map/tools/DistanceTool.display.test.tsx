import { act, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { MeasurementPanel } from './DistanceTool.display'
import type { MeasurementPanelHandle } from './DistanceTool.display'

describe('MeasurementPanel', () => {
  it('shows confirmed total plus imperatively updated temporary segment while drawing', () => {
    const ref = createRef<MeasurementPanelHandle>()

    render(
      <MeasurementPanel
        ref={ref}
        isClosed={false}
        perimeterValue={0}
        measurementValue={163.02}
        isDrawingDistance={true}
        formatDistance={(value) => `${value.toFixed(2)} km`}
        formatArea={(value) => `${value.toFixed(2)} m²`}
        onReset={vi.fn()}
      />,
    )

    expect(screen.getByText('163.02 km')).toBeInTheDocument()

    act(() => {
      ref.current?.updateLive(237.46, 74.44)
    })

    expect(screen.getByText('+74.44 km')).toBeInTheDocument()
  })

  it('shows only temporary total when drawing the first segment', () => {
    const ref = createRef<MeasurementPanelHandle>()

    render(
      <MeasurementPanel
        ref={ref}
        isClosed={false}
        perimeterValue={0}
        measurementValue={0}
        isDrawingDistance={true}
        formatDistance={(value) => `${value.toFixed(2)} km`}
        formatArea={(value) => `${value.toFixed(2)} m²`}
        onReset={vi.fn()}
      />,
    )

    act(() => {
      ref.current?.updateLive(74.44, 74.44)
    })

    expect(screen.getByText('74.44 km')).toBeInTheDocument()
    expect(screen.queryByText('+74.44 km')).not.toBeInTheDocument()
  })
})
