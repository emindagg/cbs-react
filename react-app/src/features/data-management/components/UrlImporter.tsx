import { useState } from 'react'

interface UrlImporterProps {
  onImport: (url: string, onSuccess: () => void) => void
  isLoading: boolean
}

export function UrlImporter({ onImport, isLoading }: UrlImporterProps) {
  const [urlInput, setUrlInput] = useState('')

  const handleImport = () => {
    onImport(urlInput, () => setUrlInput(''))
  }

  return (
    <div className="border-t border-zinc-200 pt-3 mt-3">
      <label className="block text-xs font-medium text-zinc-700 mb-1">
        URL'den Veri Yukle
      </label>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://ornek.com/veri.geojson"
          className="w-full sm:flex-1 px-2.5 py-2 sm:py-1.5 border border-zinc-300 bg-white rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
        <button
          onClick={handleImport}
          disabled={isLoading}
          className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-xs ${isLoading ? 'opacity-70' : ''}`}
          title="URL'den yukle"
        >
          <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} mr-2 sm:mr-0`}></i>
          <span className="sm:hidden">Yukle</span>
        </button>
      </div>
      <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center">
        <i className="fa-solid fa-circle-info mr-1"></i>
        GeoJSON, KML (.kml), Shapefile (.zip)
      </p>
    </div>
  )
}

