import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useVisualizationStore } from '@/stores/useVisualizationStore'

import VizWizardStep1 from './Step1'

const {
  columnMapperCtorMock,
  detectColumnsMock,
  loadFileMock,
  toastMock,
} = vi.hoisted(() => {
  const toast = Object.assign(vi.fn(), { error: vi.fn() })

  return {
    columnMapperCtorMock: vi.fn(),
    detectColumnsMock: vi.fn(),
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
      pending: {
        matrix: [
          ['2024 Türkiye il bazlı özet raporu', '', ''],
          ['İl', 'Değer', 'Not'],
          ['Ankara', '10', 'Merkez'],
          ['İzmir', '20', 'Kıyı'],
        ],
        firstNonEmptyRow: 2,
        lastNonEmptyRow: 5,
        suggestedHeaderRowIndex: 3,
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
      },
    })

    const mapperMock = {
      rawData: null as Record<string, unknown>[] | null,
      columns: [] as string[],
      detectColumns: detectColumnsMock,
      loadFile: loadFileMock,
    }

    columnMapperCtorMock.mockImplementation(() => mapperMock)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores pending excel selection and advances to next step', async () => {
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

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(useVisualizationStore.getState().rawData).toBeNull()
    expect(useVisualizationStore.getState().pendingExcel).toEqual({
      matrix: [
        ['2024 Türkiye il bazlı özet raporu', '', ''],
        ['İl', 'Değer', 'Not'],
        ['Ankara', '10', 'Merkez'],
        ['İzmir', '20', 'Kıyı'],
      ],
      firstNonEmptyRow: 2,
      lastNonEmptyRow: 5,
      suggestedHeaderRowIndex: 3,
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
  })

  it('applies parsed data and advances after delay when file is ready', async () => {
    loadFileMock.mockImplementationOnce(async () => {
      const mapper = columnMapperCtorMock.mock.results[0]?.value as {
        rawData: Record<string, unknown>[] | null
        columns: string[]
      }
      mapper.rawData = parsedRows
      mapper.columns = ['İl', 'Değer']
      return {
        kind: 'ready',
        fileInfo: {
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
        },
      }
    })

    const onNext = vi.fn()
    const { container } = render(<VizWizardStep1 onNext={onNext} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      fireEvent.change(input, {
        target: {
          files: [new File(['dummy'], 'ready.csv')],
        },
      })
    })

    await flushMicrotasks()

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(useVisualizationStore.getState().rawData).toEqual(parsedRows)
    expect(useVisualizationStore.getState().columns).toEqual(['İl', 'Değer'])
    expect(useVisualizationStore.getState().columnMapping.locationColumn).toBe('İl')
    expect(toastMock).toHaveBeenCalledWith(
      'Excel temizlendi: 2 boş üst satır, 1 üst satır.',
    )
    expect(onNext).toHaveBeenCalledTimes(1)
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
