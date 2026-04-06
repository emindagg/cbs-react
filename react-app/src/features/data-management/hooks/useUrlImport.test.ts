import { renderHook, act, waitFor } from '@testing-library/react'
import toast from 'react-hot-toast'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { parseGeoJSON } from '../services/import/geoJsonProcessor'
import { parseKML } from '../services/import/kmlProcessor'
import { parseShapefile } from '../services/import/shapefileProcessor'
import { useDataManagementStore } from '../store/useDataManagementStore'
import type { DataManagementStore } from '../types'
import { useUrlImport } from './useUrlImport'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../store/useDataManagementStore')
vi.mock('../services/import/geoJsonProcessor')
vi.mock('../services/import/kmlProcessor')
vi.mock('../services/import/shapefileProcessor')

// Mock global fetch
global.fetch = vi.fn()

describe('useUrlImport', () => {
  const mockAddItems = vi.fn()
  const mockToast = vi.mocked(toast)
  const mockFetch = vi.mocked(global.fetch)
  const mockParseGeoJSON = vi.mocked(parseGeoJSON)
  const mockParseKML = vi.mocked(parseKML)
  const mockParseShapefile = vi.mocked(parseShapefile)

  const mockGeoItems = [
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
  ] as unknown as ReturnType<typeof parseGeoJSON>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDataManagementStore).mockImplementation(
      (selector => selector({ addItems: mockAddItems } as unknown as DataManagementStore)) as typeof useDataManagementStore,
    )

    mockParseGeoJSON.mockReturnValue(mockGeoItems)
    mockParseKML.mockResolvedValue(mockGeoItems)
    mockParseShapefile.mockResolvedValue(mockGeoItems)
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useUrlImport())

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('handleUrlImport', () => {
    it('should do nothing if URL is empty', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()

      await act(async () => {
        await result.current.handleUrlImport('', onSuccess)
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should fetch and parse GeoJSON from URL, stamping sourceLabel', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.geojson'

      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [28.0, 41.0] },
            properties: { name: 'Istanbul' },
          },
        ],
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGeoJSON),
      } as unknown as Response)

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(url)
        expect(mockParseGeoJSON).toHaveBeenCalledWith(mockGeoJSON, 'URL Import')
        expect(mockAddItems).toHaveBeenCalledWith(
          mockGeoItems.map(item => ({ ...item, sourceLabel: 'data.geojson' })),
        )
        expect(mockToast.success).toHaveBeenCalledWith('2 veri URL uzerinden yuklendi.')
        expect(onSuccess).toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should fetch and parse JSON from URL', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.json'

      const mockJSON = { type: 'FeatureCollection', features: [] }

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockJSON),
      } as unknown as Response)

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(url)
        expect(mockParseGeoJSON).toHaveBeenCalledWith(mockJSON, 'URL Import')
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should fetch and parse KML from URL', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.kml'

      const mockKMLText = '<?xml version="1.0"?><kml>...</kml>'

      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(mockKMLText),
      } as unknown as Response)

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(url)
        expect(mockParseKML).toHaveBeenCalledWith(mockKMLText, 'URL Import')
        expect(mockAddItems).toHaveBeenCalledWith(
          mockGeoItems.map(item => ({ ...item, sourceLabel: 'data.kml' })),
        )
        expect(mockToast.success).toHaveBeenCalledWith('2 veri URL uzerinden yuklendi.')
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should fetch and parse Shapefile from URL', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.zip'

      const mockArrayBuffer = new ArrayBuffer(8)

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      } as unknown as Response)

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(url)
        expect(mockParseShapefile).toHaveBeenCalledWith(mockArrayBuffer, 'URL Import')
        expect(mockAddItems).toHaveBeenCalledWith(
          mockGeoItems.map(item => ({ ...item, sourceLabel: 'data.zip' })),
        )
        expect(mockToast.success).toHaveBeenCalledWith('2 veri URL uzerinden yuklendi.')
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should handle fetch error (non-ok response)', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.geojson'

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response)

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'URL yuklemede hata olustu. CORS veya format kontrol edin.',
        )
        expect(mockAddItems).not.toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle network error', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.geojson'

      mockFetch.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'URL yuklemede hata olustu. CORS veya format kontrol edin.',
        )
        expect(mockAddItems).not.toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle parse error', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.geojson'

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response)

      mockParseGeoJSON.mockImplementation(() => {
        throw new Error('Invalid GeoJSON')
      })

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'URL yuklemede hata olustu. CORS veya format kontrol edin.',
        )
        expect(mockAddItems).not.toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should show error toast and still call onSuccess when parse returns empty array', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.geojson'

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
      } as unknown as Response)

      mockParseGeoJSON.mockReturnValue([])

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockAddItems).not.toHaveBeenCalled()
        expect(mockToast.error).toHaveBeenCalledWith('URL iceriginde aktarilabilir veri bulunamadi.')
        expect(onSuccess).toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set loading state during import', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.geojson'

      mockFetch.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
              } as unknown as Response)
            }, 100)
          }),
      )

      act(() => {
        result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 3000 })
    })

    it('should handle KML parse error', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.kml'

      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('invalid kml'),
      } as unknown as Response)

      mockParseKML.mockRejectedValue(new Error('Invalid KML'))

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'URL yuklemede hata olustu. CORS veya format kontrol edin.',
        )
        expect(onSuccess).not.toHaveBeenCalled()
      })
    })

    it('should handle Shapefile parse error', async () => {
      const { result } = renderHook(() => useUrlImport())
      const onSuccess = vi.fn()
      const url = 'https://example.com/data.zip'

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      } as unknown as Response)

      mockParseShapefile.mockRejectedValue(new Error('Invalid Shapefile'))

      await act(async () => {
        await result.current.handleUrlImport(url, onSuccess)
      })

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'URL yuklemede hata olustu. CORS veya format kontrol edin.',
        )
        expect(onSuccess).not.toHaveBeenCalled()
      })
    })
  })
})
