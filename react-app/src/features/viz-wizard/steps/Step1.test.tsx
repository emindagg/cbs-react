import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useVisualizationStore } from '@/stores/useVisualizationStore'

import VizWizardStep1 from './Step1'

const {
  columnMapperCtorMock,
  detectColumnsMock,
  finalizeExcelSelectionMock,
  loadFileMock,
  toastMock,
} = vi.hoisted(() => {
  const toast = Object.assign(vi.fn(), { error: vi.fn() })

  return {
    columnMapperCtorMock: vi.fn(),
    detectColumnsMock: vi.fn(),
    finalizeExcelSelectionMock: vi.fn(),
    loadFileMock: vi.fn(),
    toastMock: toast,
  }
})

vi.mock('react-hot-toast', () => ({
  default: toastMock,
}))

vi.mock('@/utils/columnMapper', () => ({
  ColumnMapper: columnMapperCtorMock,
}))

describe('VizWizardStep1', () => {
  const parsedRows = [
    { İl: 'Ankara', Değer: '10' },
    { İl: 'İzmir', Değer: '20' },
  ]

  const flushMicrotasks = async () => {
    await act(async () => {
      await Promise.resolve()
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    useVisualizationStore.getState().reset()

    detectColumnsMock.mockReturnValue({
      locationColumn: 'İl',
      districtColumn: null,
      dataColumn: 'Değer',
      locationLevel: 'province',
    })

    loadFileMock.mockResolvedValue({
      kind: 'needs-header-selection',
      preview: {
        previewRows: [
          ['2024 Türkiye il bazlı özet raporu', '', ''],
          ['İl', 'Değer', 'Not'],
          ['Ankara', '10', 'Merkez'],
          ['İzmir', '20', 'Kıyı'],
        ],
        previewRowIndices: [2, 3, 4, 5],
        firstNonEmptyRow: 2,
        lastNonEmptyRow: 5,
        suggestedHeaderRowIndex: 3,
        hasReliableHeaderSuggestion: true,
      },
    })

    const mapperMock = {
      rawData: null as Record<string, unknown>[] | null,
      columns: [] as string[],
      detectColumns: detectColumnsMock,
      loadFile: loadFileMock,
      finalizeExcelSelection: finalizeExcelSelectionMock.mockImplementation(function finalizeImpl() {
        mapperMock.rawData = parsedRows
        mapperMock.columns = ['İl', 'Değer']
        return {
          rowCount: 2,
          columns: ['İl', 'Değer'],
          preview: parsedRows,
          warnings: [
            {
              code: 'TITLE_ROWS_SKIPPED',
              message: '1 üst satır atlandı.',
            },
          ],
          stats: {
            mode: 'header-row',
            headerRowIndex: 3,
            dataStartRowIndex: 4,
            leadingEmptyRowsSkipped: 2,
            titleRowsSkipped: 1,
            emptyRowsRemoved: 0,
            emptyColumnsRemoved: 0,
            sourceRowCount: 4,
            outputRowCount: 2,
          },
        }
      }),
    }

    columnMapperCtorMock.mockImplementation(() => mapperMock)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens Excel preview and only advances after the user confirms header row', async () => {
    const onNext = vi.fn()
    const { container } = render(<VizWizardStep1 onNext={onNext} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(input, {
        target: {
          files: [new File(['dummy'], 'test.xlsx')],
        },
      })
    })

    await flushMicrotasks()

    expect(screen.getByText('Excel Önizleme')).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
    expect(useVisualizationStore.getState().rawData).toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Başlığı Onayla' }))
    })

    expect(finalizeExcelSelectionMock).toHaveBeenCalledWith('header-row', 3)
    expect(useVisualizationStore.getState().rawData).toEqual(parsedRows)
    expect(useVisualizationStore.getState().columns).toEqual(['İl', 'Değer'])
    expect(useVisualizationStore.getState().columnMapping.locationColumn).toBe('İl')
    expect(toastMock).toHaveBeenCalledWith('Excel temizlendi: 2 boş üst satır, 1 üst satır.')

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('supports no-header mode and finalizes from the selected data row', async () => {
    finalizeExcelSelectionMock.mockImplementationOnce(function finalizeNoHeader() {
      const mapper = columnMapperCtorMock.mock.results[0]?.value as {
        rawData: Record<string, unknown>[] | null
        columns: string[]
      }
      mapper.rawData = [
        { 'Kolon A': 'Ankara', 'Kolon B': '10' },
        { 'Kolon A': 'İzmir', 'Kolon B': '20' },
      ]
      mapper.columns = ['Kolon A', 'Kolon B']
      return {
        rowCount: 2,
        columns: ['Kolon A', 'Kolon B'],
        preview: mapper.rawData,
        warnings: [],
        stats: {
          mode: 'no-header',
          headerRowIndex: -1,
          dataStartRowIndex: 4,
          leadingEmptyRowsSkipped: 2,
          titleRowsSkipped: 2,
          emptyRowsRemoved: 0,
          emptyColumnsRemoved: 1,
          sourceRowCount: 4,
          outputRowCount: 2,
        },
      }
    })

    const onNext = vi.fn()
    const { container } = render(<VizWizardStep1 onNext={onNext} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(input, {
        target: {
          files: [new File(['dummy'], 'no-header.xlsx')],
        },
      })
    })

    await flushMicrotasks()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Başlık yok' }))
    })

    await flushMicrotasks()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Veri başlangıcı satırı 5'))
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Veri Başlangıcını Onayla' }))
    })

    expect(finalizeExcelSelectionMock).toHaveBeenCalledWith('no-header', 4)
    expect(useVisualizationStore.getState().columns).toEqual(['Kolon A', 'Kolon B'])
    expect(toastMock).toHaveBeenCalledWith(
      'Excel temizlendi: başlık kullanılmadı, 2 boş üst satır, 2 üst satır, 1 boş sütun.',
    )
    expect(onNext).not.toHaveBeenCalled()
  })

  it('shows a fatal error and does not advance when parsing fails', async () => {
    loadFileMock.mockRejectedValueOnce(new Error('Excel içinde güvenilir bir başlık satırı bulunamadı.'))

    const onNext = vi.fn()
    const { container } = render(<VizWizardStep1 onNext={onNext} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(input, {
        target: {
          files: [new File(['dummy'], 'broken.xlsx')],
        },
      })
    })

    await flushMicrotasks()

    expect(toastMock.error).toHaveBeenCalledWith(
      'Dosya yüklenemedi: Excel içinde güvenilir bir başlık satırı bulunamadı.',
    )
    expect(useVisualizationStore.getState().rawData).toBeNull()
    expect(onNext).not.toHaveBeenCalled()
  })
})
