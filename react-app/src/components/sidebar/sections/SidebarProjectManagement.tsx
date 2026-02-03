import { useState } from 'react'
import { useDataStore } from '@/stores/useDataStore'

export default function SidebarProjectManagement() {
    const { items } = useDataStore()
    const [exportFormat, setExportFormat] = useState('geojson')

    const handleExport = () => {
        if (items.length === 0) {
            alert('Dışa aktarılacak veri bulunamadı.')
            return
        }

        try {
            if (exportFormat === 'geojson') {
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: items.map(item => ({
                        type: 'Feature',
                        geometry: item.geometry,
                        properties: { ...item.properties, name: item.name, date: item.date }
                    }))
                }

                const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/geo+json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `cbs-proje-${new Date().toISOString().slice(0, 10)}.geojson`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                alert('Proje GeoJSON olarak indirildi.')
            } else {
                alert(`${exportFormat.toUpperCase()} formatı henüz desteklenmiyor. Lütfen GeoJSON seçiniz.`)
            }
        } catch (error) {
            console.error('Export error:', error)
            alert('Dışa aktarma sırasında hata oluştu.')
        }
    }

    return (
        <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">Proje Yönetimi</h3>

            <div className="mb-3">
                <label className="block text-xs font-medium text-zinc-700 mb-1">Dışa Aktarma Formatı</label>
                <div className="relative">
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
                    >
                        <option value="geojson">GeoJSON - CBS uyumlu (.geojson)</option>
                        <option value="kml" disabled>KML - Google Earth (.kml) (Yakında)</option>
                        <option value="kmz" disabled>KMZ - Sıkıştırılmış KML (.kmz) (Yakında)</option>
                        <option value="shp" disabled>Shapefile - GIS (.zip) (Yakında)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-zinc-500">
                        <i className="fa-solid fa-chevron-down text-xs"></i>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <button
                    onClick={handleExport}
                    className="w-full bg-zinc-900 hover:bg-black text-white font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95 shadow-sm"
                >
                    <i className="fa-solid fa-download mr-2"></i>Projeyi İndir
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <label className="bg-zinc-700 hover:bg-zinc-800 text-white font-medium py-2 px-3 rounded-lg text-center cursor-pointer text-sm transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95 shadow-sm">
                        <i className="fa-solid fa-upload mr-1.5"></i>Yükle
                        <input type="file" className="hidden" accept=".geojson,.kml,.kmz,.shp,.zip,.csv,.xlsx,.xls" />
                    </label>
                    <button className="border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-medium py-2 px-2 rounded-lg text-xs transition-all opacity-50 cursor-not-allowed flex items-center justify-center" disabled>
                        <i className="fa-solid fa-chart-bar mr-1"></i>Rapor
                    </button>
                </div>

                <div className="border-t border-zinc-200 pt-3 mt-3">
                    <label className="block text-xs font-medium text-zinc-700 mb-1">🌐 URL'den Veri Yükle</label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <input type="text" placeholder="https://ornek.com/veri.geojson" className="w-full sm:flex-1 px-2.5 py-2 sm:py-1.5 border border-zinc-300 bg-white rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                        <button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm" title="URL'den yükle">
                            <i className="fa-solid fa-cloud-arrow-up mr-2 sm:mr-0"></i>
                            <span className="sm:hidden">Yükle</span>
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center">
                        <i className="fa-solid fa-circle-info mr-1"></i>
                        GeoJSON, KML, CSV formatları desteklenir
                    </p>
                </div>
            </div>
        </section>
    )
}
