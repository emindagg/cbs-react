import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import toast from 'react-hot-toast'

import { useDataStore } from '@/stores/useDataStore'

import { useUrlImport } from './useUrlImport'
import { parseGeoJSON } from '../services/geoJsonProcessor'
import { parseKML } from '../services/kmlProcessor'
import { parseShapefile } from '../services/shapefileProcessor'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('@/stores/useDataStore')
vi.mock('../services/geoJsonProcessor')
vi.mock('../services/kmlProcessor')
vi.mock('../services/shapefileProcessor')

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
    ] as any

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useDataStore).mockReturnValue({
            addItems: mockAddItems,
            items: [],
            setItems: vi.fn(),
            clearItems: vi.fn(),
        } as any)

        // Default mock implementations
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

        it('should fetch and parse GeoJSON from URL', async () => {
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
            } as any)

            await act(async () => {
                await result.current.handleUrlImport(url, onSuccess)
            })

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(url)
                expect(mockParseGeoJSON).toHaveBeenCalledWith(mockGeoJSON, 'URL Import')
                expect(mockAddItems).toHaveBeenCalledWith(mockGeoItems)
                expect(mockToast.success).toHaveBeenCalledWith('2 adet veri URL\'den yüklendi.')
                expect(onSuccess).toHaveBeenCalled()
                expect(result.current.isLoading).toBe(false)
            })
        })

        it('should fetch and parse JSON from URL', async () => {
            const { result } = renderHook(() => useUrlImport())
            const onSuccess = vi.fn()
            const url = 'https://example.com/data.json'

            const mockJSON = {
                type: 'FeatureCollection',
                features: [],
            }

            mockFetch.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockJSON),
            } as any)

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
            } as any)

            await act(async () => {
                await result.current.handleUrlImport(url, onSuccess)
            })

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(url)
                expect(mockParseKML).toHaveBeenCalledWith(mockKMLText, 'URL Import')
                expect(mockAddItems).toHaveBeenCalledWith(mockGeoItems)
                expect(mockToast.success).toHaveBeenCalledWith('2 adet veri URL\'den yüklendi.')
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
            } as any)

            await act(async () => {
                await result.current.handleUrlImport(url, onSuccess)
            })

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(url)
                expect(mockParseShapefile).toHaveBeenCalledWith(mockArrayBuffer, 'URL Import')
                expect(mockAddItems).toHaveBeenCalledWith(mockGeoItems)
                expect(mockToast.success).toHaveBeenCalledWith('2 adet veri URL\'den yüklendi.')
                expect(onSuccess).toHaveBeenCalled()
            })
        })

        it('should handle fetch error', async () => {
            const { result } = renderHook(() => useUrlImport())
            const onSuccess = vi.fn()
            const url = 'https://example.com/data.geojson'

            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
            } as any)

            await act(async () => {
                await result.current.handleUrlImport(url, onSuccess)
            })

            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith(
                    'URL yüklenirken hata oluştu. CORS kısıtlamaları veya geçersiz URL olabilir.'
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
                    'URL yüklenirken hata oluştu. CORS kısıtlamaları veya geçersiz URL olabilir.'
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
            } as any)

            mockParseGeoJSON.mockImplementation(() => {
                throw new Error('Invalid GeoJSON')
            })

            await act(async () => {
                await result.current.handleUrlImport(url, onSuccess)
            })

            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith(
                    'URL yüklenirken hata oluştu. CORS kısıtlamaları veya geçersiz URL olabilir.'
                )
                expect(mockAddItems).not.toHaveBeenCalled()
                expect(onSuccess).not.toHaveBeenCalled()
                expect(result.current.isLoading).toBe(false)
            })
        })

        it('should not add items if parse returns empty array', async () => {
            const { result } = renderHook(() => useUrlImport())
            const onSuccess = vi.fn()
            const url = 'https://example.com/data.geojson'

            mockFetch.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
            } as any)

            mockParseGeoJSON.mockReturnValue([])

            await act(async () => {
                await result.current.handleUrlImport(url, onSuccess)
            })

            await waitFor(() => {
                expect(mockAddItems).not.toHaveBeenCalled()
                expect(mockToast.success).not.toHaveBeenCalled()
                expect(onSuccess).toHaveBeenCalled()
                expect(result.current.isLoading).toBe(false)
            })
        })

        it('should set loading state during import', async () => {
            const { result } = renderHook(() => useUrlImport())
            const onSuccess = vi.fn()
            const url = 'https://example.com/data.geojson'

            mockFetch.mockImplementation(() =>
                new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            ok: true,
                            json: vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
                        } as any)
                    }, 100)
                })
            )

            act(() => {
                result.current.handleUrlImport(url, onSuccess)
            })

            // Should be loading immediately
            await waitFor(() => {
                expect(result.current.isLoading).toBe(true)
            })

            // Wait for completion
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
            } as any)

            mockParseKML.mockRejectedValue(new Error('Invalid KML'))

            await act(async () => {
                await result.current.handleUrlImport(url, onSuccess)
            })

            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith(
                    'URL yüklenirken hata oluştu. CORS kısıtlamaları veya geçersiz URL olabilir.'
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
            } as any)

            mockParseShapefile.mockRejectedValue(new Error('Invalid Shapefile'))

            await act(async () => {
                await result.current.handleUrlImport(url, onSuccess)
            })

            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith(
                    'URL yüklenirken hata oluştu. CORS kısıtlamaları veya geçersiz URL olabilir.'
                )
                expect(onSuccess).not.toHaveBeenCalled()
            })
        })
    })
})
