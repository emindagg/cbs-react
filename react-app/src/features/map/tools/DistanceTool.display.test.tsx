import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MeasurementPanel } from './DistanceTool.display'

describe('MeasurementPanel', () => {
  it('shows confirmed total plus temporary segment while drawing after at least one segment', () => {
    render(
      <MeasurementPanel
        isClosed={false}
        perimeterValue={0}
        measurementValue={163.02}
        tempTotalDistance={237.46}
        tempSegmentDistance={74.44}
        isDrawingDistance={true}
        formatDistance={(value) => `${value.toFixed(2)} km`}
        formatArea={(value) => `${value.toFixed(2)} m²`}
        onReset={vi.fn()}
      />,
    )

    expect(screen.getByText('163.02 km')).toBeInTheDocument()
    expect(screen.getByText('+74.44 km')).toBeInTheDocument()
  })

  it('shows only temporary total when drawing the first segment', () => {
    render(
      <MeasurementPanel
        isClosed={false}
        perimeterValue={0}
        measurementValue={0}
        tempTotalDistance={74.44}
        tempSegmentDistance={74.44}
        isDrawingDistance={true}
        formatDistance={(value) => `${value.toFixed(2)} km`}
        formatArea={(value) => `${value.toFixed(2)} m²`}
        onReset={vi.fn()}
      />,
    )

    expect(screen.getByText('74.44 km')).toBeInTheDocument()
    expect(screen.queryByText('+74.44 km')).not.toBeInTheDocument()
  })
})
