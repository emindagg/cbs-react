import { renderHook, act, waitFor } from '@testing-library/react'
import type { ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { parseFile } from '../services/import/fileParser'
import { useDataManagementStore } from '../store/useDataManagementStore'
import type { DataManagementStore } from '../types'
import { useFileImport } from './useFileImport'
import { transformToGeoItems } from '../utils/dataMapper'

type FileImportChangeEvent = ChangeEvent<HTMLInputElement>

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../store/useDataManagementStore')
vi.mock('../services/import/fileParser')
vi.mock('../utils/dataMapper')

describe('useFileImport', () => {
  const mockAddItems = vi.fn()
  const mockParseFile = vi.mocked(parseFile)
  const mockToast = vi.mocked(toast)
  const mockTransformToGeoItems = vi.mocked(transformToGeoItems)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDataManagementStore).mockImplementation(
      (selector => selector({ addItems: mockAddItems } as unknown as DataManagementStore)) as typeof useDataManagementStore,
    )

    mockTransformToGeoItems.mockReturnValue([
      {
        id: '1',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [28.0, 41.0] },
        properties: { name: 'Istanbul' },
        date: new Date(),
        visible: true,
      },
      {
        id: '2',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [32.8, 39.9] },
        properties: { name: 'Ankara' },
        date: new Date(),
        visible: true,
      },
    ] as unknown as ReturnType<typeof transformToGeoItems>)
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useFileImport())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.showMapper).toBe(false)
      expect(result.current.mapperData).toBeNull()
      expect(result.current.fileInputRef.current).toBeNull()
    })
  })

  describe('handleFileImport', () => {
    it('should handle GeoJSON file and stamp sourceLabel', async () => {
      const { result } = renderHook(() => useFileImport())

      const mockItems = [
        {
          id: '1',
          name: 'Item 1',
          type: 'point' as const,
          geometry: { type: 'Point' as const, coordinates: [28.0, 41.0] },
          properties: { name: 'Item 1' },
          date: new Date().toISOString(),
          visible: true,
        },
        {
          id: '2',
          name: 'Item 2',
          type: 'point' as const,
          geometry: { type: 'Point' as const, coordinates: [28.5, 41.5] },
          properties: { name: 'Item 2' },
          date: new Date().toISOString(),
          visible: true,
        },
      ]

      mockParseFile.mockResolvedValue({
        needsMapping: false,
        items: mockItems,
      })

      const mockFile = new File(['{}'], 'test.geojson', { type: 'application/json' })
      const mockEvent = {
        target: { files: [mockFile] },
      } as unknown as FileImportChangeEvent

      await act(async () => {
        await result.current.handleFileImport(mockEvent)
      })

      await waitFor(() => {
        expect(mockAddItems).toHaveBeenCalledWith(
          mockItems.map(item => ({ ...item, sourceLabel: 'test.geojson' })),
        )
        expect(mockToast.success).toHaveBeenCalledWith('2 veri yuklendi.')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should show mapper for Excel files', async () => {
      const { result } = renderHook(() => useFileImport())

      const mockHeaders = ['City', 'Population', 'Lat', 'Lon']
      const mockData = [
        { City: 'Istanbul', Population: 15000000, Lat: 41.0, Lon: 28.0 },
        { City: 'Ankara', Population: 5000000, Lat: 39.9, Lon: 32.8 },
      ]

      mockParseFile.mockResolvedValue({
        needsMapping: true,
        headers: mockHeaders,
        data: mockData,
        mapping: { lat: 'Lat', lon: 'Lon', name: 'City' },
      })

      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const mockEvent = {
        target: { files: [mockFile] },
      } as unknown as FileImportChangeEvent

      await act(async () => {
        await result.current.handleFileImport(mockEvent)
      })

      await waitFor(() => {
        expect(result.current.showMapper).toBe(true)
        expect(result.current.mapperData).toEqual({
          headers: mockHeaders,
          previewData: mockData.slice(0, 5),
          initialMapping: { lat: 'Lat', lon: 'Lon', name: 'City' },
          jsonData: mockData,
        })
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should show error toast when file has no importable data', async () => {
      const { result } = renderHook(() => useFileImport())

      mockParseFile.mockResolvedValue({
        needsMapping: false,
        items: [],
      })

      const mockFile = new File(['{}'], 'empty.geojson', { type: 'application/json' })
      const mockEvent = {
        target: { files: [mockFile] },
      } as unknown as FileImportChangeEvent

      await act(async () => {
        await result.current.handleFileImport(mockEvent)
      })

      await waitFor(() => {
        expect(mockAddItems).not.toHaveBeenCalled()
        expect(mockToast.error).toHaveBeenCalledWith('Dosyada aktarilabilir veri bulunamadi.')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should call addItems in chunks when item count exceeds 2000', async () => {
      const { result } = renderHook(() => useFileImport())

      const bigItems = Array.from({ length: 2500 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
        type: 'point' as const,
        geometry: { type: 'Point' as const, coordinates: [28.0, 41.0] },
        properties: {},
        date: new Date().toISOString(),
        visible: true,
      }))

      mockParseFile.mockResolvedValue({ needsMapping: false, items: bigItems })

      const mockFile = new File(['{}'], 'big.geojson', { type: 'application/json' })
      const mockEvent = {
        target: { files: [mockFile] },
      } as unknown as FileImportChangeEvent

      await act(async () => {
        await result.current.handleFileImport(mockEvent)
      })

      await waitFor(() => {
        // 2500 items split into 2 chunks: [0..1999] and [2000..2499]
        expect(mockAddItems).toHaveBeenCalledTimes(2)
        expect(mockAddItems.mock.calls[0][0]).toHaveLength(2000)
        expect(mockAddItems.mock.calls[1][0]).toHaveLength(500)
        expect(mockAddItems.mock.calls[0][0][0]).toMatchObject({ sourceLabel: 'big.geojson' })
      })
    })

    it('should handle parse error', async () => {
      const { result } = renderHook(() => useFileImport())

      const errorMessage = 'Invalid file format'
      mockParseFile.mockRejectedValue(new Error(errorMessage))

      const mockFile = new File(['invalid'], 'test.txt', { type: 'text/plain' })
      const mockEvent = {
        target: { files: [mockFile] },
      } as unknown as FileImportChangeEvent

      await act(async () => {
        await result.current.handleFileImport(mockEvent)
      })

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(errorMessage)
        expect(mockAddItems).not.toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle no file selected', async () => {
      const { result } = renderHook(() => useFileImport())

      const mockEvent = {
        target: { files: [] },
      } as unknown as FileImportChangeEvent

      await act(async () => {
        await result.current.handleFileImport(mockEvent)
      })

      expect(mockParseFile).not.toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('handleMapperConfirm', () => {
    it('should transform, stamp sourceLabel, and add items when mapper is confirmed', async () => {
      const { result } = renderHook(() => useFileImport())

      const mockHeaders = ['City', 'Lat', 'Lon']
      const mockData = [
        { City: 'Istanbul', Lat: 41.0, Lon: 28.0 },
        { City: 'Ankara', Lat: 39.9, Lon: 32.8 },
      ]

      mockParseFile.mockResolvedValue({
        needsMapping: true,
        headers: mockHeaders,
        data: mockData,
        mapping: { lat: 'Lat', lon: 'Lon', name: 'City' },
      })

      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const mockEvent = {
        target: { files: [mockFile] },
      } as unknown as FileImportChangeEvent

      await act(async () => {
        await result.current.handleFileImport(mockEvent)
      })

      await waitFor(() => {
        expect(result.current.showMapper).toBe(true)
        expect(result.current.mapperData).not.toBeNull()
      })

      const mapping = { lat: 'Lat', lon: 'Lon', name: 'City' }

      await act(async () => {
        await result.current.handleMapperConfirm(mapping)
      })

      await waitFor(() => {
        expect(mockAddItems).toHaveBeenCalled()
        expect(mockToast.success).toHaveBeenCalled()
        expect(result.current.showMapper).toBe(false)
        expect(result.current.mapperData).toBeNull()
      })
    })

    it('should do nothing if mapperData is null', async () => {
      const { result } = renderHook(() => useFileImport())

      await act(async () => {
        await result.current.handleMapperConfirm({ lat: 'Lat', lon: 'Lon', name: 'City' })
      })

      expect(mockAddItems).not.toHaveBeenCalled()
    })
  })

  describe('closeMapper', () => {
    it('should close mapper and clear data', async () => {
      const { result } = renderHook(() => useFileImport())

      mockParseFile.mockResolvedValue({
        needsMapping: true,
        headers: ['City', 'Lat', 'Lon'],
        data: [{ City: 'Istanbul', Lat: 41.0, Lon: 28.0 }],
        mapping: { lat: 'Lat', lon: 'Lon', name: 'City' },
      })

      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const mockEvent = {
        target: { files: [mockFile] },
      } as unknown as FileImportChangeEvent

      await act(async () => {
        await result.current.handleFileImport(mockEvent)
      })

      await waitFor(() => {
        expect(result.current.showMapper).toBe(true)
        expect(result.current.mapperData).not.toBeNull()
      })

      act(() => {
        result.current.closeMapper()
      })

      expect(result.current.showMapper).toBe(false)
      expect(result.current.mapperData).toBeNull()
    })
  })
})
