import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CustomBreaksInput } from './CustomBreaksInput'

describe('CustomBreaksInput', () => {
  it('rejects fewer than 4 break values', () => {
    const onChange = vi.fn()
    render(<CustomBreaksInput customBreaks={undefined} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0, 100, 200' } })

    expect(screen.getByText(/En az 4 sınır değeri gerekli/)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rejects more than 8 break values', () => {
    const onChange = vi.fn()
    render(<CustomBreaksInput customBreaks={undefined} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0,1,2,3,4,5,6,7,8' } })

    expect(screen.getByText(/En fazla 8 sınır değeri girilebilir/)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('accepts valid 4-8 break values and emits parsed numbers', () => {
    const onChange = vi.fn()
    render(<CustomBreaksInput customBreaks={undefined} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0, 100, 300, 600' } })

    expect(onChange).toHaveBeenCalledWith([0, 100, 300, 600])
    expect(screen.queryByText(/En az/)).not.toBeInTheDocument()
    expect(screen.queryByText(/En fazla/)).not.toBeInTheDocument()
  })
})

