import { useState } from 'react'

interface UrlImporterProps {
  onImport: (url: string, onSuccess: () => void) => void;
  isLoading: boolean;
}

/**
 * URL import component
 */
export function UrlImporter({ onImport, isLoading }: UrlImporterProps) {
  const [urlInput, setUrlInput] = useState('')

  const handleImport = () => {
    onImport(urlInput, () => setUrlInput(''))
  }

  return (
    <div className="border-t border-zinc-200 pt-3 mt-3">
      <label className="flex items-center gap-1.5 mb-1 text-xs font-normal text-[#1c1c1e] select-none">
        <i className="fa-solid fa-link shrink-0 text-[10px] text-[#1c1c1e]" aria-hidden />
        URL'den Veri Yükle
      </label>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://ornek.com/veri.geojson"
          className="w-full sm:flex-1 px-2.5 py-2 sm:py-1.5 border border-zinc-300 bg-white rounded-lg text-xs font-normal text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          onClick={handleImport}
          disabled={isLoading}
          className={`w-full sm:w-auto bg-zinc-900 hover:bg-black text-white font-normal py-2 sm:py-1.5 px-3 rounded-lg text-xs flex items-center justify-center shadow-xs ${isLoading ? 'opacity-70' : ''}`}
          title="URL'den yükle"
        >
          <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} mr-2 sm:mr-0`}></i>
          <span className="sm:hidden">Yükle</span>
        </button>
      </div>
      <p className="text-[10px] font-normal text-zinc-500 mt-1.5 flex items-center gap-1">
        <i className="fa-solid fa-circle-info shrink-0 text-[10px] text-[#1c1c1e]/70" aria-hidden />
        <span>GeoJSON, KML (.kml), Shapefile (.zip)</span>
      </p>
    </div>
  )
}
