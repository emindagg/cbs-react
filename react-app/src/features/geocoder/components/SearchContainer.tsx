import { useGeocoder } from '../hooks/useGeocoder'
import { GlobeToggleButton } from '@/features/globe-view'

interface SearchContainerProps {
    leftPosition: string
}

/**
 * SearchContainer Component
 * Horizontal search bar with geocoder, layers, globe, storymap buttons
 */
export function SearchContainer({ leftPosition }: SearchContainerProps) {
    const { isOpen, query, setQuery, open, close, inputRef } = useGeocoder()

    const handleSearchSubmit = () => {
        if (query.trim()) {
            console.log('Searching for:', query)
            // TODO: Implement geocoder search
        }
    }

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
                            onClick={close}
                            className="py-2.5 px-3 bg-transparent border-none text-white/70 cursor-pointer hover:bg-white/10 hover:text-white"
                            title="Kapat"
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SearchContainer
