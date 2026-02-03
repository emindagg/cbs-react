import type { AtlasFeature } from '../services/geocoderService'

interface SearchResultsProps {
  results: { features: AtlasFeature[] } | null;
  isSearching: boolean;
  error: string | null;
  onResultClick: (feature: AtlasFeature) => void;
  formatAddress: (properties: any) => string;
}

/**
 * SearchResults Component
 * Displays geocoder results in a dropdown list
 */
export function SearchResults({
  results,
  isSearching,
  error,
  onResultClick,
  formatAddress,
}: SearchResultsProps) {
  if (!results && !error && !isSearching) return null

  return (
    <div className="bg-white rounded-b-[18px] shadow-lg max-h-80 overflow-y-auto border-t border-zinc-100">
      {isSearching && (
        <div className="p-4 text-center text-sm text-zinc-500 flex items-center justify-center gap-2">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <span>Aranıyor...</span>
        </div>
      )}

      {error && !isSearching && (
        <div className="p-4 text-center text-sm text-red-600 flex items-center justify-center gap-2">
          <i className="fa-solid fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {results && !isSearching && results.features.length > 0 && (
        <div className="divide-y divide-zinc-100">
          {results.features.map((feature, index) => {
            const name = feature.properties.name || feature.properties.place_name || 'İsimsiz konum'
            const address = formatAddress(feature.properties)

            return (
              <button
                key={index}
                onClick={() => onResultClick(feature)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer text-left group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <i className="fa-solid fa-location-dot text-blue-500 group-hover:scale-110 transition-transform"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 truncate">
                    {name}
                  </div>
                  {address && (
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {address}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {results && !isSearching && results.features.length === 0 && (
        <div className="p-4 text-center text-sm text-zinc-500">
          Sonuç bulunamadı
        </div>
      )}
    </div>
  )
}

export default SearchResults
