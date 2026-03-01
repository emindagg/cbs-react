import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useMapStore } from '@/stores/useMapStore'
import { useStorymapModalStore } from '@/stores/useStorymapModalStore'

import { SearchResults } from './SearchResults'
import { useGeocoder } from '../hooks/useGeocoder'
import { GeocoderManager, type GeocoderResponse, type GeocoderResult } from '../services/geocoderService'

interface SearchContainerProps {
  leftPosition: string;
  isSidebarOpen?: boolean;
  globeControl?: ReactNode;
  onLayersClick?: () => void;
  isLayersOpen?: boolean;
}

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_DELAY = 500 // ms

/**
 * SearchContainer Component
 * Horizontal search bar with geocoder, layers, globe, storymap buttons
 */
export function SearchContainer({
  leftPosition,
  isSidebarOpen = false,
  globeControl,
  onLayersClick,
  isLayersOpen = false,
}: SearchContainerProps) {
  const { isOpen, query, setQuery, open, close, inputRef } = useGeocoder()
  const { mapInstance } = useMapStore()
  const isMobile = !useMediaQuery('(min-width: 768px)')
  const hideControls = isMobile && isSidebarOpen
  const [results, setResults] = useState<GeocoderResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const geocoderManagerRef = useRef<GeocoderManager | null>(null)

  // Initialize GeocoderManager when map is ready
  useEffect(() => {
    if (mapInstance && !geocoderManagerRef.current) {
      geocoderManagerRef.current = new GeocoderManager(mapInstance)
    }
  }, [mapInstance])

  const handleSearchSubmit = useCallback(async () => {
    const trimmedQuery = query.trim()
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setError(`En az ${MIN_QUERY_LENGTH} harf girmelisiniz`)
      return
    }
    if (!geocoderManagerRef.current) {
      setError('Harita henüz hazır değil')
      return
    }
    setIsSearching(true)
    setError(null)
    setResults(null)
    try {
      const searchResults = await geocoderManagerRef.current.search(query)
      setResults(searchResults)
    } catch (err: unknown) {
      console.error('Search error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Arama sırasında bir hata oluştu'
      setError(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }, [query])

  const handleResultClick = (feature: GeocoderResult) => {
    if (!geocoderManagerRef.current) return

    geocoderManagerRef.current.focusOnResult(feature)
    setResults(null)
    close()
  }

  const handleClose = () => {
    if (geocoderManagerRef.current) {
      geocoderManagerRef.current.clearResults()
    }
    close()
    setResults(null)
    setError(null)
  }

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults(null)
      setError(null)
      setIsSearching(false)
      return
    }
    debounceTimerRef.current = setTimeout(() => {
      handleSearchSubmit()
    }, DEBOUNCE_DELAY)
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, handleSearchSubmit])

  if (hideControls) return null

  return (
    <div
      id="search-container"
      className="fixed top-3 z-10000 transition-all duration-300 ease-in-out"
      style={{ left: leftPosition }}
    >
      {!isOpen && (
        <button
          id="geocoder-toggle-btn"
          onClick={open}
          className="w-9 h-9 bg-[#1c1c1e] rounded-full shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-sm hover:bg-black/90 active:scale-95 transition-all cursor-pointer"
          title="Arama"
        >
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
      )}

      <button
        id="layers-toggle-btn"
        onClick={onLayersClick}
        className={`absolute top-0 w-9 h-9 rounded-full shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-sm active:scale-95 transition-all cursor-pointer ${isLayersOpen ? 'bg-black' : 'bg-[#1c1c1e] hover:bg-black/90'}`}
        style={{ left: isOpen ? '355px' : '46px' }}
        title="Katmanlar"
      >
        <i className="fa-solid fa-map"></i>
      </button>

      {globeControl && (
        <div
          className="absolute top-0"
          style={{ left: isOpen ? '401px' : '92px' }}
        >
          {globeControl}
        </div>
      )}

      <button
        id="storymap-toggle-btn"
        type="button"
        onClick={() => useStorymapModalStore.getState().open()}
        className="absolute top-0 h-9 bg-[#1c1c1e] rounded-[18px] shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-[11px] font-medium hover:bg-black/90 active:scale-95 transition-all cursor-pointer px-3.5 whitespace-nowrap"
        style={{
          left: isOpen ? '447px' : '138px',
          letterSpacing: '-0.3px',
        }}
        title="Hikâye Haritası"
      >
        <span>Hikâye Haritası</span>
      </button>

      {isOpen && (
        <div
          id="geocoder-input-container"
          className="absolute top-0 left-0 bg-[#1c1c1e] rounded-[18px] shadow-[0_2px_8px_rgba(34,34,34,0.35)] overflow-hidden animate-in slide-in-from-left-2 duration-200"
          style={{ width: '345px', maxWidth: '90vw' }}
        >
          <div className="flex items-center relative">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                id="geocoder-search-input"
                placeholder="Haritada Ara"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="w-full py-2.5 px-4 text-sm bg-transparent border-none text-white outline-hidden placeholder:text-white/50"
                autoComplete="off"
              />
            </div>
            <button
              id="geocoder-search-btn"
              onClick={handleSearchSubmit}
              className="py-2.5 px-3.5 bg-transparent border-none text-white cursor-pointer hover:bg-white/10"
              title="Ara"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
            <button
              id="geocoder-close-btn"
              onClick={handleClose}
              className="py-2.5 px-3 bg-transparent border-none text-white/70 cursor-pointer hover:bg-white/10 hover:text-white"
              title="Kapat"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          <SearchResults
            results={results}
            isSearching={isSearching}
            error={error}
            onResultClick={handleResultClick}
            formatAddress={(props) => geocoderManagerRef.current?.formatAddress(props) || ''}
          />
        </div>
      )}
    </div>
  )
}

