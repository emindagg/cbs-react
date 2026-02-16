import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import toast from 'react-hot-toast'

import { VisualizationManager } from '@/features/visualization'
import { ColumnMapper } from '@/utils/columnMapper'

import { useMatching } from './useMatching'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('@/features/visualization')
vi.mock('@/utils/columnMapper')

describe('useMatching', () => {
    const mockToast = vi.mocked(toast)
    const mockMap = {
        getLayer: vi.fn(),
        getSource: vi.fn(),
    } as any

    const mockProvincesGeoJSON = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { ADI: 'İstanbul', IL: '34' },
                geometry: { type: 'Polygon', coordinates: [] },
            },
        ],
    }

    const mockDistrictsGeoJSON = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { ILCEAD: 'Kadıköy', ILAD: 'İstanbul', key: 'istanbul_kadikoy' },
                geometry: { type: 'Polygon', coordinates: [] },
            },
        ],
    }

    const mockProvinceIndex = {
        istanbul: {
            name: 'İstanbul',
            properties: { ADI: 'İstanbul', IL: '34' },
            geometry: { type: 'Polygon', coordinates: [] },
        },
    }

    const mockDistrictIndex = {
        kadikoy: [
            {
                name: 'Kadıköy',
                province: 'İstanbul',
                compositeKey: 'istanbul_kadikoy',
                properties: { ILCEAD: 'Kadıköy', ILAD: 'İstanbul' },
                geometry: { type: 'Polygon', coordinates: [] },
            },
        ],
    }

    const mockRawData = [
        { location: 'İstanbul', value: 100 },
        { location: 'Ankara', value: 200 },
    ]

    const mockColumnMapping = {
        locationColumn: 'location',
        districtColumn: null,
        dataColumn: 'value',
        locationLevel: 'province' as const,
    }

    const mockMatchResults = {
        successful: [
            {
                rowIndex: 0,
                matched: true,
                ambiguous: false,
                location: 'İstanbul',
                value: 100,
                originalData: { location: 'İstanbul', value: 100 },
            },
        ],
        ambiguous: [],
        failed: [],
    }

    const defaultProps = {
        rawData: mockRawData,
        columnMapping: mockColumnMapping,
        map: mockMap,
        provincesGeoJSON: null,
        districtsGeoJSON: null,
        provinceIndex: null,
        districtIndex: null,
        setProvincesGeoJSON: vi.fn(),
        setDistrictsGeoJSON: vi.fn(),
        setProvinceIndex: vi.fn(),
        setDistrictIndex: vi.fn(),
    }

    let mockVizManager: any
    let mockMapper: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock VisualizationManager
        mockVizManager = {
            loadProvincesGeoJSON: vi.fn().mockResolvedValue(mockProvincesGeoJSON),
            loadDistrictsGeoJSON: vi.fn().mockResolvedValue(mockDistrictsGeoJSON),
            getProvinceIndex: vi.fn().mockReturnValue(mockProvinceIndex),
            getDistrictIndex: vi.fn().mockReturnValue(mockDistrictIndex),
        }
        vi.mocked(VisualizationManager).mockImplementation(function (this: any) {
            return mockVizManager
        } as any)

        // Mock ColumnMapper
        mockMapper = {
            rawData: null,
            columns: [],
            setColumnMapping: vi.fn(),
            setIndexes: vi.fn(),
            matchData: vi.fn().mockReturnValue(mockMatchResults),
        }
        vi.mocked(ColumnMapper).mockImplementation(function (this: any) {
            return mockMapper
        } as any)
    })

    describe('initial state', () => {
        it('should initialize with correct default values', () => {
            const { result } = renderHook(() => useMatching(defaultProps))

            expect(result.current.isMatching).toBe(false)
            expect(result.current.hasMatched).toBe(false)
        })
    })

    describe('performMatching', () => {
        it('should return null if no data provided', async () => {
            const { result } = renderHook(() =>
                useMatching({ ...defaultProps, rawData: null }),
            )

            const matchResult = await act(async () => {
                return await result.current.performMatching()
            })

            expect(matchResult).toBeNull()
            expect(result.current.isMatching).toBe(false)
        })

        it('should return null if no map provided', async () => {
            const { result } = renderHook(() =>
                useMatching({ ...defaultProps, map: null }),
            )

            const matchResult = await act(async () => {
                return await result.current.performMatching()
            })

            expect(matchResult).toBeNull()
            expect(result.current.isMatching).toBe(false)
        })

        it('should load province data and perform matching for province level', async () => {
            const { result } = renderHook(() => useMatching(defaultProps))

            let matchResult: any

            await act(async () => {
                matchResult = await result.current.performMatching()
            })

            await waitFor(() => {
                expect(defaultProps.setProvincesGeoJSON).toHaveBeenCalledWith(mockProvincesGeoJSON)
                expect(defaultProps.setProvinceIndex).toHaveBeenCalledWith(mockProvinceIndex)
                expect(matchResult).toEqual(mockMatchResults)
                expect(result.current.hasMatched).toBe(true)
                expect(result.current.isMatching).toBe(false)
            })
        })

        it('should load district data and perform matching for district level', async () => {
            const districtMapping = {
                ...mockColumnMapping,
                locationLevel: 'district' as const,
            }

            const { result } = renderHook(() =>
                useMatching({ ...defaultProps, columnMapping: districtMapping }),
            )

            let matchResult: any

            await act(async () => {
                matchResult = await result.current.performMatching()
            })

            await waitFor(() => {
                expect(defaultProps.setDistrictsGeoJSON).toHaveBeenCalledWith(mockDistrictsGeoJSON)
                expect(defaultProps.setDistrictIndex).toHaveBeenCalledWith(mockDistrictIndex)
                expect(matchResult).toEqual(mockMatchResults)
                expect(result.current.hasMatched).toBe(true)
                expect(result.current.isMatching).toBe(false)
            })
        })

        it('should load both province and district data for mixed level', async () => {
            const mixedMapping = {
                ...mockColumnMapping,
                locationLevel: 'mixed' as const,
            }

            const { result } = renderHook(() =>
                useMatching({ ...defaultProps, columnMapping: mixedMapping }),
            )

            let matchResult: any

            await act(async () => {
                matchResult = await result.current.performMatching()
            })

            await waitFor(() => {
                expect(defaultProps.setDistrictsGeoJSON).toHaveBeenCalledWith(mockDistrictsGeoJSON)
                expect(defaultProps.setDistrictIndex).toHaveBeenCalledWith(mockDistrictIndex)
                expect(defaultProps.setProvincesGeoJSON).toHaveBeenCalledWith(mockProvincesGeoJSON)
                expect(defaultProps.setProvinceIndex).toHaveBeenCalledWith(mockProvinceIndex)
                expect(matchResult).toEqual(mockMatchResults)
                expect(result.current.hasMatched).toBe(true)
            })
        })

        it('should use existing province data if already loaded', async () => {
            const propsWithExistingData = {
                ...defaultProps,
                provincesGeoJSON: mockProvincesGeoJSON as any,
                provinceIndex: mockProvinceIndex as any,
            }

            const { result } = renderHook(() => useMatching(propsWithExistingData))

            await act(async () => {
                await result.current.performMatching()
            })

            await waitFor(() => {
                // Should not call setters if data already exists
                expect(propsWithExistingData.setProvincesGeoJSON).not.toHaveBeenCalled()
                expect(propsWithExistingData.setProvinceIndex).not.toHaveBeenCalled()
                expect(result.current.hasMatched).toBe(true)
            })
        })

        it('should use data override when provided', async () => {
            const { result } = renderHook(() => useMatching(defaultProps))

            const overrideData = [
                { location: 'Ankara', value: 300 },
            ]

            await act(async () => {
                await result.current.performMatching(overrideData)
            })

            await waitFor(() => {
                expect(result.current.hasMatched).toBe(true)
            })
        })

        it('should handle matching errors', async () => {
            const errorMessage = 'Matching failed'

            // Override mockMapper for this test
            mockMapper.matchData = vi.fn().mockImplementation(() => {
                throw new Error(errorMessage)
            })

            const { result } = renderHook(() => useMatching(defaultProps))

            let matchResult: any

            await act(async () => {
                matchResult = await result.current.performMatching()
            })

            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith(`Eşleştirme hatası: ${errorMessage}`)
                expect(matchResult).toBeNull()
                expect(result.current.isMatching).toBe(false)
            })
        })

        it('should set isMatching state during matching', async () => {
            const { result } = renderHook(() => useMatching(defaultProps))

            // Start matching
            act(() => {
                result.current.performMatching()
            })

            // Should be matching immediately after calling (but before awaiting)
            await waitFor(() => {
                expect(result.current.isMatching).toBe(true)
            })

            // Wait for completion
            await waitFor(() => {
                expect(result.current.isMatching).toBe(false)
            })
        })

        it('should load province index if GeoJSON exists but index does not', async () => {
            const propsWithGeoJSONOnly = {
                ...defaultProps,
                provincesGeoJSON: mockProvincesGeoJSON as any,
                provinceIndex: null,
            }

            const { result } = renderHook(() => useMatching(propsWithGeoJSONOnly))

            await act(async () => {
                await result.current.performMatching()
            })

            await waitFor(() => {
                expect(mockVizManager.loadProvincesGeoJSON).toHaveBeenCalled()
                expect(propsWithGeoJSONOnly.setProvinceIndex).toHaveBeenCalledWith(mockProvinceIndex)
                expect(result.current.hasMatched).toBe(true)
            })
        })

        it('should load district index if GeoJSON exists but index does not', async () => {
            const districtMapping = {
                ...mockColumnMapping,
                locationLevel: 'district' as const,
            }

            const propsWithGeoJSONOnly = {
                ...defaultProps,
                columnMapping: districtMapping,
                districtsGeoJSON: mockDistrictsGeoJSON as any,
                districtIndex: null,
            }

            const { result } = renderHook(() => useMatching(propsWithGeoJSONOnly))

            await act(async () => {
                await result.current.performMatching()
            })

            await waitFor(() => {
                expect(mockVizManager.loadDistrictsGeoJSON).toHaveBeenCalled()
                expect(propsWithGeoJSONOnly.setDistrictIndex).toHaveBeenCalledWith(mockDistrictIndex)
                expect(result.current.hasMatched).toBe(true)
            })
        })
    })
})
