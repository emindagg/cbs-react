import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StepsSection } from './StepsSection'

describe('StepsSection', () => {
  it('shows only 3-7 class count options', () => {
    render(
      <StepsSection
        classCount={5}
        classificationMethod="equal"
        customBreaks={undefined}
        setClassCount={vi.fn()}
        setClassificationMethod={vi.fn()}
        setCustomBreaks={vi.fn()}
      />,
    )

    const selects = screen.getAllByRole('combobox')
    const classCountSelect = selects[0]
    const optionTexts = within(classCountSelect)
      .getAllByRole('option')
      .map((option) => option.textContent)

    expect(optionTexts).toEqual(['3', '4', '5', '6', '7'])
    expect(optionTexts).not.toContain('8')
    expect(optionTexts).not.toContain('9')
  })
})

