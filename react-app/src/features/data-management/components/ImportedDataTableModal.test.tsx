import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from './ImportedDataTableModal'
import type { ConfirmState } from './ImportedDataTableModal'

function createConfirmState(onConfirm: ConfirmState['onConfirm']): ConfirmState {
  return {
    title: 'Verileri sil',
    message: '2 satır kalıcı olarak silinecek. Bu işlem geri alınamaz.',
    confirmLabel: 'Sil',
    variant: 'danger',
    onConfirm,
  }
}

describe('ConfirmDialog', () => {
  it('loading durumunda butonları kilitler ve spinner metni gösterir', async () => {
    let resolvePromise: (() => void) | null = null
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => {
      resolvePromise = resolve
    }))
    const onCancel = vi.fn()

    render(<ConfirmDialog state={createConfirmState(onConfirm)} onCancel={onCancel} />)

    const confirmButton = screen.getByRole('button', { name: 'Sil' })
    const cancelButton = screen.getByRole('button', { name: 'İptal' })

    fireEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('İşleniyor...')).toBeInTheDocument()
    expect(cancelButton).toBeDisabled()
    expect(confirmButton).toBeDisabled()

    fireEvent.click(cancelButton)
    expect(onCancel).not.toHaveBeenCalled()

    resolvePromise?.()
    expect(await screen.findByRole('button', { name: 'Sil' })).toBeEnabled()
  })
})
