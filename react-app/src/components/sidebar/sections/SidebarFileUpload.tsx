import { useState, useRef } from 'react'
import { useDataStore } from '@/stores/useDataStore'
import * as shp from 'shpjs'
import * as toGeoJSON from 'togeojson'

export default function SidebarFileUpload() {
    const { addItem } = useDataStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsProcessing(true)
        try {
            const name = file.name.split('.')[0]

            if (file.name.endsWith('.zip')) {
                // Shapefile (.zip containing .shp, .shx, .dbf)
                const buffer = await file.arrayBuffer()
                // shpjs can return FeatureCollection or array of FeatureCollections
                const geojson = await shp.parseZip(buffer)

                if (Array.isArray(geojson)) {
                    geojson.forEach((g, i) => processGeoJSON(g, `${name}-${i}`))
                } else {
                    processGeoJSON(geojson, name)
                }
            }
            else if (file.name.endsWith('.kml')) {
                const text = await file.text()
                const parser = new DOMParser()
                const kml = parser.parseFromString(text, 'text/xml')
                const geojson = toGeoJSON.kml(kml)
                processGeoJSON(geojson, name)
            }
            else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
                const text = await file.text()
                const geojson = JSON.parse(text)
                processGeoJSON(geojson, name)
            } else {
                alert('Desteklenmeyen dosya formatı. Lütfen .zip (Shapefile), .kml veya .geojson yükleyin.')
            }
        } catch (error) {
            console.error('File upload error:', error)
            alert('Dosya yüklenirken hata oluştu. Lütfen dosya formatını kontrol edin.')
        } finally {
            setIsProcessing(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const processGeoJSON = (geojson: any, baseName: string) => {
        // Flatten FeatureCollection to individual items
        if (geojson.type === 'FeatureCollection') {
            geojson.features.forEach((feature: any, index: number) => {
                const featName = feature.properties?.name || feature.properties?.Name || `${baseName} ${index + 1}`
                addFeature(feature, featName)
            })
        } else if (geojson.type === 'Feature') {
            addFeature(geojson, baseName)
        }
    }

    const addFeature = (feature: any, name: string) => {
        if (!feature.geometry) return

        const typeMap: Record<string, 'point' | 'line' | 'polygon'> = {
            'Point': 'point',
            'MultiPoint': 'point',
            'LineString': 'line',
            'MultiLineString': 'line',
            'Polygon': 'polygon',
            'MultiPolygon': 'polygon'
        }

        const mappedType = typeMap[feature.geometry.type]

        if (!mappedType) return // Skip unsupported types like GeometryCollection for now

        const date = feature.properties?.date || new Date().toISOString()

        addItem({
            name,
            date,
            type: mappedType, // Store as simplified type for icon/listing logic, but keep raw geometry
            geometry: feature.geometry,
            properties: feature.properties || {}
        })
    }

    return (
        <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group mt-2 border-t border-zinc-100 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">Dosya Yükle</h3>

            <div className="relative">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.kml,.json,.geojson"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload-input"
                    disabled={isProcessing}
                />

                <label
                    htmlFor="file-upload-input"
                    className={`
                        w-full flex flex-col items-center justify-center px-4 py-6 
                        border-2 border-dashed border-zinc-300 rounded-lg 
                        cursor-pointer hover:bg-zinc-50 hover:border-emerald-400 transition-all
                        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    {isProcessing ? (
                        <div className="flex flex-col items-center">
                            <i className="fa-solid fa-circle-notch fa-spin text-emerald-500 text-xl mb-2"></i>
                            <span className="text-xs text-zinc-500 font-medium">İşleniyor...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center">
                            <i className="fa-solid fa-cloud-arrow-up text-zinc-400 text-xl mb-2 group-hover:text-emerald-500 transition-colors"></i>
                            <span className="text-xs font-medium text-zinc-700">Dosya Seçin veya Sürükleyin</span>
                            <span className="text-[10px] text-zinc-400 mt-1">Example.zip (SHP), .kml, .geojson</span>
                        </div>
                    )}
                </label>
            </div>
        </section>
    )
}
