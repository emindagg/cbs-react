import { useState, useEffect, useRef } from 'react';
import { useGeocoder } from '../hooks/useGeocoder';
import { GlobeToggleButton } from '@/features/globe-view';
import { useMapStore } from '@/stores/useMapStore';
import { GeocoderManager, type GeocoderResponse, type GeocoderResult } from '../services/geocoderService';

interface SearchContainerProps {
    leftPosition: string;
}

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_DELAY = 500; // ms

/**
 * SearchContainer Component
 * Horizontal search bar with geocoder, layers, globe, storymap buttons
 */
export function SearchContainer({ leftPosition }: SearchContainerProps) {
    const { isOpen, query, setQuery, open, close, inputRef } = useGeocoder();
    const { mapInstance } = useMapStore();
    const [results, setResults] = useState<GeocoderResponse | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const geocoderManagerRef = useRef<GeocoderManager | null>(null);

    // Initialize GeocoderManager when map is ready
    useEffect(() => {
        if (mapInstance && !geocoderManagerRef.current) {
            geocoderManagerRef.current = new GeocoderManager(mapInstance);
        }
    }, [mapInstance]);

    const handleSearchSubmit = async () => {
        const trimmedQuery = query.trim();

        if (trimmedQuery.length < MIN_QUERY_LENGTH) {
            setError(`En az ${MIN_QUERY_LENGTH} harf girmelisiniz`);
            return;
        }

        if (!geocoderManagerRef.current) {
            setError('Harita henüz hazır değil');
            return;
        }

        setIsSearching(true);
        setError(null);
        setResults(null);

        try {
            const searchResults = await geocoderManagerRef.current.search(query);
            setResults(searchResults);

            // Don't auto-focus on first result - let user click on desired location
        } catch (err: any) {
            console.error('Search error:', err);
            setError(err.message || 'Arama sırasında bir hata oluştu');
        } finally {
            setIsSearching(false);
        }
    };

    const handleResultClick = (feature: GeocoderResult) => {
        if (!geocoderManagerRef.current) return;

        geocoderManagerRef.current.focusOnResult(feature);
        setResults(null);
        close();
    };

    const handleClose = () => {
        // Clear map markers and results
        if (geocoderManagerRef.current) {
            geocoderManagerRef.current.clearResults();
        }

        // Clear UI state
        close();
        setResults(null);
        setError(null);
    };

    // Auto-search when query changes (debounced)
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Reset results if query is too short
        if (query.trim().length < MIN_QUERY_LENGTH) {
            setResults(null);
            setError(null);
            setIsSearching(false);
            return;
        }

        // Set new timer for debounced search
        debounceTimerRef.current = setTimeout(() => {
            handleSearchSubmit();
        }, DEBOUNCE_DELAY);

        // Cleanup on unmount or query change
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [query, mapInstance]); // Dependencies: query and map

    return (
        <div
            id="search-container"
            className="fixed top-3 z-[10000] transition-all duration-300 ease-in-out"
            style={{ left: leftPosition }}
        >
            {/* Search Toggle Button - Hidden when search is open */}
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

            {/* Layers Button */}
            <button
                id="layers-toggle-btn"
                className="absolute top-0 w-9 h-9 bg-[#1c1c1e] rounded-full shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-sm hover:bg-black/90 active:scale-95 transition-all cursor-pointer"
                style={{ left: isOpen ? '355px' : '46px' }}
                title="Katmanlar"
            >
                <i className="fa-solid fa-map"></i>
            </button>

            {/* Globe Toggle Button */}
            <GlobeToggleButton
                className="absolute top-0"
                style={{ left: isOpen ? '401px' : '92px' }}
            />

            {/* Storymap Button */}
            <button
                id="storymap-toggle-btn"
                className="absolute top-0 h-9 bg-[#1c1c1e] rounded-[18px] shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-white text-[11px] font-medium hover:bg-black/90 active:scale-95 transition-all cursor-pointer px-3.5 whitespace-nowrap"
                style={{
                    left: isOpen ? '447px' : '138px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '-0.3px'
                }}
                title="Hikaye Haritası"
            >
                <span>Hikaye Haritası</span>
            </button>

            {/* Search Input Container (Collapsible) */}
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
                                className="w-full py-2.5 px-4 text-sm bg-transparent border-none text-white outline-none placeholder:text-white/50"
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

                    {/* Search Results Dropdown */}
                    {(results || error || isSearching) && (
                        <div className="bg-white rounded-b-lg shadow-lg max-h-80 overflow-y-auto">
                            {isSearching && (
                                <div className="p-4 text-center text-sm text-zinc-500">
                                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                    Aranıyor...
                                </div>
                            )}

                            {error && !isSearching && (
                                <div className="p-4 text-center text-sm text-red-600">
                                    <i className="fa-solid fa-exclamation-circle mr-2"></i>
                                    {error}
                                </div>
                            )}

                            {results && !isSearching && results.features.length > 0 && (
                                <div className="divide-y divide-zinc-100">
                                    {results.features.map((feature, index) => {
                                        const name = feature.properties.name || feature.properties.place_name || 'İsimsiz konum';
                                        const address = geocoderManagerRef.current?.formatAddress(feature.properties) || '';

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleResultClick(feature)}
                                                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer text-left"
                                            >
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <i className="fa-solid fa-location-dot text-blue-500"></i>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-zinc-900 truncate">
                                                        {name}
                                                    </div>
                                                    {address && (
                                                        <div className="text-xs text-zinc-500 truncate mt-0.5">
                                                            {address}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchContainer
