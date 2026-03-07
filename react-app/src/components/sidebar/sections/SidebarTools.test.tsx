import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useToolStore } from '@/stores/useToolStore'

import SidebarTools from './SidebarTools'

function resetToolStore() {
  useToolStore.setState({
    activeTool: 'none',
    showMeasurementTools: true,
    showAdvancedAnalysis: true,
    distancePoints: [],
    distanceGhostPoint: null,
    isDrawingDistance: false,
    toolsMenuMode: 'closed',
  })
}

describe('SidebarTools', () => {
  beforeEach(() => {
    resetToolStore()
  })

  it('shows measurement checkbox checked by default without activating measurement tool', () => {
    render(<SidebarTools />)

    const measurementCheckbox = screen.getByLabelText(/Ölçüm Araçları \(Mesafe\)/i)
    expect(measurementCheckbox).toBeChecked()
    expect(useToolStore.getState().activeTool).toBe('none')
  })

  it('turns off active measurement and clears measurement state when measurement visibility is disabled', () => {
    useToolStore.setState({
      activeTool: 'measure-distance',
      distancePoints: [[29, 41], [30, 42]],
      distanceGhostPoint: [31, 43],
      isDrawingDistance: true,
    })

    render(<SidebarTools />)

    fireEvent.click(screen.getByLabelText(/Ölçüm Araçları \(Mesafe\)/i))

    const state = useToolStore.getState()
    expect(state.showMeasurementTools).toBe(false)
    expect(state.activeTool).toBe('none')
    expect(state.distancePoints).toEqual([])
    expect(state.distanceGhostPoint).toBeNull()
    expect(state.isDrawingDistance).toBe(false)
  })
})
