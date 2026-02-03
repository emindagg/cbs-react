import { useState, useRef } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import * as toGeoJSON from '@tmcw/togeojson'
import shp from 'shpjs'
import * as XLSX from 'xlsx'
import ColumnMapperModal from '@/components/modals/ColumnMapperModal'

export default function SidebarProjectManagement() {
    const { items, addItems } = useDataStore()
    const [exportFormat, setExportFormat] = useState('geojson')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [urlInput, setUrlInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Mapper States
    const [showMapper, setShowMapper] = useState(false)
    const [mapperData, setMapperData] = useState<{
        headers: string[],
        previewData: any[],
        initialMapping: any,
        jsonData: any[]
    } | null>(null)

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
                alert(`${exportFormat.toUpperCase()} formatı henüz tam desteklenmemektedir (Sadece GeoJSON export aktiftir).`)
            }
        } catch (error) {
            console.error('Export error:', error)
            alert('Dışa aktarma sırasında hata oluştu.')
        }
    }

    const processDataWithMapping = (jsonData: any[], map: any) => {
        return jsonData.map((row: any, index: number) => {
            let geometry = null;

            // Parse geometry string if exists (format: "lat,lon;lat,lon")
            if (map.geometry && row[map.geometry]) {
                try {
                    const points = row[map.geometry].split(';').map((p: string) => {
                        const [lat, lon] = p.split(',').map(Number);
                        if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
                        return null;
                    }).filter(Boolean);

                    if (points.length > 0) {
                        const type = map.type ? row[map.type] : 'point';
                        if (type === 'polygon' || type === 'area' || type === 'alan') {
                            geometry = { type: 'Polygon', coordinates: [points.map((p: any) => [p.lon, p.lat])] };
                        } else if (type === 'line' || type === 'route' || type === 'rota') {
                            geometry = { type: 'LineString', coordinates: points.map((p: any) => [p.lon, p.lat]) };
                        } else {
                            geometry = { type: 'Point', coordinates: [points[0].lon, points[0].lat] };
                        }
                    }
                } catch (e) {
                    console.warn("Geometry parse error", e);
                }
            }

            // Fallback to basic point
            if (!geometry) {
                if (map.lat && map.lon) {
                    const lat = Number(row[map.lat]);
                    const lon = Number(row[map.lon]);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        geometry = { type: 'Point', coordinates: [lon, lat] };
                    }
                }
            }

            if (!geometry) return null;

            return {
                name: map.name ? row[map.name] : `Item ${index + 1}`,
                type: String(map.type ? row[map.type] : 'point')?.toLowerCase()?.replace('rota', 'line').replace('alan', 'polygon') || 'point',
                geometry: geometry,
                properties: row,
                visible: true,
                date: new Date().toISOString()
            };
        }).filter(Boolean);
    }

    const processExcel = async (file: File) => {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) return [];

        // Column Detection
        const headers = Object.keys(jsonData[0] as object);
        const map: any = {};

        headers.forEach(h => {
            const lower = h.toLowerCase();
            // More robust detection for Turkish characters and potential encoding issues
            if (lower.includes('lat') || lower.includes('enlem') || lower.includes('nlem')) map.lat = h;
            else if (lower.includes('lon') || lower.includes('boylam') || lower.includes('lng') || lower.includes('oylam')) map.lon = h;
            else if (lower.includes('name') || lower.includes('ad') || lower.includes('isim') || lower.includes('sim') || lower.includes('il') || lower.includes('sehir')) map.name = h;
            else if (lower.includes('type') || lower.includes('tur') || lower.includes('tür') || lower.includes('tip')) map.type = h;
            else if (lower.includes('geometry') || lower.includes('geometri')) map.geometry = h;
        });

        // Check if auto-detection failed for critical columns
        if (!map.lat || !map.lon) {
            setMapperData({
                headers,
                previewData: jsonData.slice(0, 5),
                initialMapping: map,
                jsonData
            });
            setShowMapper(true);
            return null; // Stop processing, wait for user
        }

        return processDataWithMapping(jsonData, map);
    };

    const handleMapperConfirm = (mapping: any) => {
        if (!mapperData) return;

        const itemsToAdd = processDataWithMapping(mapperData.jsonData, mapping);

        if (itemsToAdd.length > 0) {
            addItems(itemsToAdd as any);
            alert(`${itemsToAdd.length} adet veri başarıyla yüklendi.`);
        }

        setShowMapper(false);
        setMapperData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const processGeoJSON = (geojson: any, fileName: string) => {
        let features: any[] = []
        if (geojson.type === 'FeatureCollection') {
            features = geojson.features
        } else if (geojson.type === 'Feature') {
            features = [geojson]
        } else if (geojson.type === 'GeometryCollection') {
            // Handle GeometryCollection properly if needed, usually mapped to features
            features = geojson.geometries.map((geom: any) => ({ type: 'Feature', geometry: geom, properties: {} }))
        } else {
            // Single geometry
            features = [{ type: 'Feature', geometry: geojson, properties: {} }]
        }

        const newItems: any[] = []
        features.forEach((feature, index) => {
            if (feature.geometry) {
                // GeoJSON geometry type mapping to internal type
                let type: 'point' | 'line' | 'polygon' | 'circle' = 'point'
                const gType = feature.geometry.type
                if (gType === 'Point' || gType === 'MultiPoint') type = 'point'
                else if (gType === 'LineString' || gType === 'MultiLineString') type = 'line'
                else if (gType === 'Polygon' || gType === 'MultiPolygon') type = 'polygon'

                newItems.push({
                    name: feature.properties?.name || `${fileName} - ${index + 1}`,
                    type: type,
                    geometry: feature.geometry,
                    properties: feature.properties || {},
                    date: new Date().toISOString()
                })
            }
        })
        return newItems
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        let itemsToAdd: any[] = []
        let extension = ''

        try {
            const fileName = file.name.split('.')[0]
            extension = file.name.split('.').pop()?.toLowerCase() || ''

            if (extension === 'json' || extension === 'geojson') {
                const text = await file.text()
                const json = JSON.parse(text)
                itemsToAdd = processGeoJSON(json, fileName)
            }
            else if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
                const result = await processExcel(file);
                if (result) itemsToAdd = result;
            }
            else if (extension === 'kml') {
                const text = await file.text()
                const parser = new DOMParser()
                const kml = parser.parseFromString(text, 'text/xml')
                const geojson = toGeoJSON.kml(kml)
                itemsToAdd = processGeoJSON(geojson, fileName)
            }
            else if (extension === 'zip') {
                // Shapefile (zip)
                const buffer = await file.arrayBuffer()
                const geojson = await shp(buffer)
                if (Array.isArray(geojson)) {
                    geojson.forEach(g => {
                        itemsToAdd = [...itemsToAdd, ...processGeoJSON(g, fileName)]
                    })
                } else {
                    itemsToAdd = processGeoJSON(geojson, fileName)
                }
            }
            else {
                alert('Desteklenmeyen dosya formatı. Lütfen .geojson, .kml, .xlsx, .csv veya .zip (Shapefile) yükleyin.')
                return
            }

            if (itemsToAdd.length > 0) {
                addItems(itemsToAdd)
                alert(`${itemsToAdd.length} adet veri başarıyla yüklendi.`)
            }
        } catch (error) {
            console.error('Import Error:', error)
            alert('Dosya yüklenirken hata oluştu: ' + (error as any).message)
        } finally {
            setIsLoading(false)
            // If items added (success) OR not a mapper-handling file (error/other), clear input.
            // If it IS excel/csv and NO items added, we assume mapper is shown (or empty file), so keep input for now.
            if (fileInputRef.current && (itemsToAdd.length > 0 || (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv'))) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleUrlImport = async () => {
        if (!urlInput) return
        setIsLoading(true)
        try {
            const response = await fetch(urlInput)
            if (!response.ok) throw new Error('Dosya indirilemedi')

            let itemsToAdd: any[] = []

            if (urlInput.endsWith('.zip')) {
                const buffer = await response.arrayBuffer()
                const geojson = await shp(buffer)
                if (Array.isArray(geojson)) {
                    geojson.forEach(g => itemsToAdd = [...itemsToAdd, ...processGeoJSON(g, 'URL Import')])
                } else {
                    itemsToAdd = processGeoJSON(geojson, 'URL Import')
                }
            } else if (urlInput.endsWith('.kml')) {
                const text = await response.text()
                const parser = new DOMParser()
                const kml = parser.parseFromString(text, 'text/xml')
                const geojson = toGeoJSON.kml(kml)
                itemsToAdd = processGeoJSON(geojson, 'URL Import')
            } else {
                // Assume GeoJSON/JSON for others
                const json = await response.json()
                itemsToAdd = processGeoJSON(json, 'URL Import')
            }

            if (itemsToAdd.length > 0) {
                addItems(itemsToAdd)
                alert(`${itemsToAdd.length} adet veri URL'den yüklendi.`)
            }
            setUrlInput('')
        } catch (error) {
            console.error('URL Import Error:', error)
            alert('URL yüklenirken hata oluştu. CORS kısıtlamaları veya geçersiz URL olabilir.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
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
                            <option value="kml">KML - Google Earth (.kml) (Yakında)</option>
                            <option value="shp">Shapefile - GIS (.zip) (Yakında)</option>
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
                        <label className={`bg-zinc-700 hover:bg-zinc-800 text-white font-medium py-2 px-3 rounded-lg text-center cursor-pointer text-sm transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95 shadow-sm ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
                            <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-upload'} mr-1.5`}></i>
                            {isLoading ? 'Yükleniyor...' : 'Yükle'}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".geojson,.json,.kml,.zip,.xlsx,.xls,.csv"
                                onChange={handleFileChange}
                            />
                        </label>
                        <button className="border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-medium py-2 px-2 rounded-lg text-xs transition-all opacity-50 cursor-not-allowed flex items-center justify-center" disabled>
                            <i className="fa-solid fa-chart-bar mr-1"></i>Rapor
                        </button>
                    </div>

                    <div className="border-t border-zinc-200 pt-3 mt-3">
                        <label className="block text-xs font-medium text-zinc-700 mb-1">🌐 URL'den Veri Yükle</label>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://ornek.com/veri.geojson"
                                className="w-full sm:flex-1 px-2.5 py-2 sm:py-1.5 border border-zinc-300 bg-white rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            />
                            <button
                                onClick={handleUrlImport}
                                disabled={isLoading}
                                className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm ${isLoading ? 'opacity-70' : ''}`}
                                title="URL'den yükle"
                            >
                                <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} mr-2 sm:mr-0`}></i>
                                <span className="sm:hidden">Yükle</span>
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center">
                            <i className="fa-solid fa-circle-info mr-1"></i>
                            GeoJSON, KML (.kml), Shapefile (.zip)
                        </p>
                    </div>
                </div>
            </section>

            {/* Column Mapper Modal */}
            {mapperData && (
                <ColumnMapperModal
                    isOpen={showMapper}
                    onClose={() => {
                        setShowMapper(false);
                        setMapperData(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    onConfirm={handleMapperConfirm}
                    headers={mapperData.headers}
                    previewData={mapperData.previewData}
                    initialMapping={mapperData.initialMapping}
                />
            )}
        </>
    )
}
