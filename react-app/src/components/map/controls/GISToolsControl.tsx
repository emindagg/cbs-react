import { useState, useRef, useEffect } from 'react'
import { useToolStore } from '@/stores/useToolStore'
import { useDataStore } from '@/stores/useDataStore'
import { useMap } from 'react-map-gl/maplibre'
import * as turf from '@turf/turf'

/**
 * GISToolsControl
 * 
 * Replicates the legacy "CBS Araçları" floating menu.
 * Contains:
 * - Distance/Area Measurement
 * - Buffer Analysis (Etki Alanı)
 * - Future placeholders (Clusters, Heatmap, etc.)
 * - Cleaning tools
 */
export default function GISToolsControl() {
    const [isOpen, setIsOpen] = useState(false)
    const [showBufferModal, setShowBufferModal] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { current: map } = useMap()

    const {
        setActiveTool,
        activeTool,
        resetDistance,
        resetDraw
    } = useToolStore()

    const { items, addItem, clearAll } = useDataStore()

    // Buffer State
    const [selectedLayerId, setSelectedLayerId] = useState('')
    const [bufferRadius, setBufferRadius] = useState(500)
    const [bufferUnit, setBufferUnit] = useState<turf.Units>('meters')

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleMenu = () => setIsOpen(!isOpen)

    const handleScreenshot = () => {
        if (!map) return

        try {
            const canvas = map.getCanvas()
            const dataURL = canvas.toDataURL('image/png')

            const a = document.createElement('a')
            a.href = dataURL
            a.download = `harita-goruntusu-${new Date().toISOString().slice(0, 19).replace('T', '_')}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

            setIsOpen(false)
        } catch (e) {
            console.error('Screenshot error:', e)
            alert('Ekran görüntüsü alınamadı.')
        }
    }

    const handleToolSelect = (tool: any) => {
        if (tool === 'buffer') {
            setShowBufferModal(true)
            setIsOpen(false)
        } else if (tool === 'screenshot') {
            handleScreenshot()
        } else if (tool === 'clean-visuals') {
            // Only clear temp tools for now
            resetDistance()
            resetDraw()
            // clearAll() // Be careful with this, maybe user wants to keep data
            alert('Görselleştirmeler temizlendi.')
            setIsOpen(false)
        } else {
            setActiveTool(tool)
            setIsOpen(false)
        }
    }

    const handleBufferAnalyze = () => {
        if (!selectedLayerId) return

        const selectedItem = items.find(i => i.id === selectedLayerId)
        if (!selectedItem || !selectedItem.geometry) return

        try {
            const buffered = turf.buffer(selectedItem.geometry as any, bufferRadius, { units: bufferUnit })
            if (buffered) {
                addItem({
                    name: `Buffer (${bufferRadius} ${bufferUnit}) - ${selectedItem.name}`,
                    date: new Date().toISOString(),
                    type: 'polygon',
                    geometry: buffered.geometry,
                    properties: { analysis: 'buffer' }
                })
                alert('Tampon bölge oluşturuldu!')
                setShowBufferModal(false)
            }
        } catch (e) {
            console.error(e)
            alert('Analiz hatası.')
        }
    }

    return (
        <div className="absolute top-4 right-14 z-10 font-sans" ref={dropdownRef}>
            {/* Main Toggle Button */}
            <button
                onClick={toggleMenu}
                className="bg-white hover:bg-zinc-50 text-zinc-800 font-semibold py-2 px-3 rounded-md shadow-md flex items-center gap-2 border border-zinc-200 transition-all text-sm"
            >
                <i className="fa-solid fa-wrench text-amber-600"></i>
                <span>CBS Araçları</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 bg-zinc-50">
                            Ölçüm & Analiz
                        </div>

                        <MenuButton
                            icon="fa-solid fa-ruler-combined"
                            label="Mesafe & Alan Ölçüm"
                            color="text-blue-600"
                            onClick={() => handleToolSelect('measure-distance')}
                            active={activeTool === 'measure-distance'}
                        />
                        <MenuButton
                            icon="fa-regular fa-circle-dot"
                            label="Etki Alanı"
                            color="text-purple-600"
                            onClick={() => handleToolSelect('buffer')}
                        />

                        <div className="border-t border-zinc-100 my-1"></div>

                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50">
                            İleri Analizler
                        </div>
                        <MenuButton icon="fa-solid fa-layer-group" label="Nokta Kümeleri" color="text-slate-600" disabled />
                        <MenuButton icon="fa-solid fa-vector-square" label="Dış Sınır" color="text-orange-600" disabled />
                        <MenuButton icon="fa-solid fa-border-all" label="En Yakın Alanlar" color="text-teal-600" disabled />
                        <MenuButton icon="fa-solid fa-location-crosshairs" label="En Yakın İki Nokta" color="text-rose-600" disabled />
                        <MenuButton icon="fa-solid fa-fire" label="Isı Haritası" color="text-red-600" disabled />

                        <div className="border-t border-zinc-100 my-1"></div>

                        <MenuButton
                            icon="fa-solid fa-eraser text-indigo-500"
                            label="Görselleştirmeyi Temizle"
                            onClick={() => handleToolSelect('clean-visuals')}
                        />
                        <MenuButton
                            icon="fa-solid fa-broom text-amber-500"
                            label="Katalog Verisini Temizle"
                            onClick={clearAll}
                        />
                        <MenuButton
                            icon="fa-solid fa-trash-can text-red-500"
                            label="Ölçümleri Temizle"
                            onClick={resetDistance}
                        />

                        <div className="border-t border-zinc-100 my-1"></div>

                        <MenuButton
                            icon="fa-solid fa-camera text-slate-600"
                            label="Ekran Görüntüsü"
                            onClick={() => handleToolSelect('screenshot')}
                        />
                    </div>
                </div>
            )}

            {/* Buffer Modal (Simple Overlay) */}
            {showBufferModal && (
                <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                                <i className="fa-regular fa-circle-dot text-purple-600"></i>
                                Etki Alanı Analizi
                            </h3>
                            <button onClick={() => setShowBufferModal(false)} className="text-zinc-400 hover:text-zinc-600">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1">Katman Seçimi</label>
                                <select
                                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={selectedLayerId}
                                    onChange={e => setSelectedLayerId(e.target.value)}
                                >
                                    <option value="">Seçiniz...</option>
                                    {items.filter(i => i.visible).map(i => (
                                        <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">Mesafe</label>
                                    <input
                                        type="number"
                                        value={bufferRadius}
                                        onChange={e => setBufferRadius(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">Birim</label>
                                    <select
                                        value={bufferUnit}
                                        onChange={e => setBufferUnit(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="meters">Metre</option>
                                        <option value="kilometers">Kilometre</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex gap-2 justify-end">
                            <button
                                onClick={() => setShowBufferModal(false)}
                                className="px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleBufferAnalyze}
                                disabled={!selectedLayerId}
                                className="px-3 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Analizi Başlat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function MenuButton({ icon, label, onClick, color = 'text-zinc-600', active, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm transition-colors
                ${active ? 'bg-zinc-100 text-zinc-900 font-medium' : 'hover:bg-zinc-50 text-zinc-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <i className={`${icon} ${color} w-4 text-center`}></i>
            <span>{label}</span>
            {disabled && <span className="ml-auto text-[10px] bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded">Yakında</span>}
        </button>
    )
}
