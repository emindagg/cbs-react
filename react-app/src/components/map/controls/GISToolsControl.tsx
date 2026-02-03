import { useState, useRef, useEffect } from 'react'
import { useToolStore } from '@/stores/useToolStore'
import { useDataStore } from '@/stores/useDataStore'
import { useMap } from 'react-map-gl/maplibre'
import * as turf from '@turf/turf'
import { useClusteringStore } from '@/features/clustering'

/**
 * GISToolsControl Component
 * 
 * Compact Light List Design - Minimalist and efficient GIS tools menu.
 * Includes all measurement, analysis, and cleaning tools.
 */
export default function GISToolsControl() {
    const [showBufferModal, setShowBufferModal] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const { current: map } = useMap()

    // Clustering Store
    const { isEnabled: isClusteringEnabled, toggle: toggleClustering } = useClusteringStore()

    const {
        isToolsMenuOpen,
        setIsToolsMenuOpen,
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
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsToolsMenuOpen(false)
            }
        }
        if (isToolsMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isToolsMenuOpen, setIsToolsMenuOpen])

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
            setIsToolsMenuOpen(false)
        } catch (e) {
            console.error('Screenshot error:', e)
        }
    }

    const handleToolSelect = (tool: any) => {
        if (tool === 'buffer') {
            setShowBufferModal(true)
            setIsToolsMenuOpen(false)
        } else if (tool === 'clustering') {
            toggleClustering()
            setIsToolsMenuOpen(false)
        } else if (tool === 'screenshot') {
            handleScreenshot()
        } else if (tool === 'clean-visuals') {
            resetDistance()
            resetDraw()
            setIsToolsMenuOpen(false)
        } else {
            setActiveTool(tool)
            setIsToolsMenuOpen(false)
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
                setShowBufferModal(false)
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div ref={containerRef} className="absolute top-3 right-3 z-[10002] flex flex-col items-end">
            {/* Main Toggle Button */}
            <button
                id="toggle-gis-tools"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsToolsMenuOpen(!isToolsMenuOpen);
                }}
                className={`
                    w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300
                    ${isToolsMenuOpen
                        ? 'bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
                        : 'bg-[#1c1c1e] hover:bg-black shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                    }
                    border-none text-white cursor-pointer
                `}
                title="CBS Araçları"
            >
                <i className={`fa-solid fa-screwdriver-wrench text-[13px] ${isToolsMenuOpen ? 'rotate-45' : ''} transition-transform duration-300`}></i>
            </button>

            {/* Compact Light List Dropdown */}
            {isToolsMenuOpen && (
                <div className="mt-2 w-52 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1.5 divide-y divide-zinc-50">
                        {/* Ölçüm & Analiz */}
                        <div className="py-1">
                            <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Ölçüm & Analiz</div>
                            <CompactMenuItem
                                icon="fa-ruler-combined"
                                label="Mesafe & Alan"
                                color="text-blue-500"
                                onClick={() => handleToolSelect('measure-distance')}
                                active={activeTool === 'measure-distance'}
                            />
                        </div>

                        {/* İleri Analizler */}
                        <div className="py-1">
                            <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">İleri Analizler</div>
                            <CompactMenuItem
                                icon="fa-circle-dot"
                                label="Etki Alanı Analizi"
                                color="text-purple-500"
                                onClick={() => handleToolSelect('buffer')}
                            />
                            <CompactMenuItem
                                icon="fa-layer-group"
                                label={isClusteringEnabled ? "Kümeleri Kapat" : "Nokta Kümeleri"}
                                color="text-blue-500"
                                onClick={() => handleToolSelect('clustering')}
                                active={isClusteringEnabled}
                            />
                            <CompactMenuItem icon="fa-vector-square" label="Dış Sınır" color="text-orange-400" disabled />
                            <CompactMenuItem icon="fa-border-all" label="En Yakın Alanlar" color="text-teal-400" disabled />
                            <CompactMenuItem icon="fa-fire" label="Isı Haritası" color="text-red-400" disabled />
                        </div>

                        {/* Genel Araçlar */}
                        <div className="py-1">
                            <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Genel Araçlar</div>
                            <CompactMenuItem
                                icon="fa-camera"
                                label="Ekran Görüntüsü"
                                color="text-zinc-500"
                                onClick={() => handleToolSelect('screenshot')}
                            />
                            <CompactMenuItem
                                icon="fa-eraser"
                                label="Haritayı Temizle"
                                color="text-indigo-500"
                                onClick={() => handleToolSelect('clean-visuals')}
                            />
                        </div>

                        {/* Sıfırlama Araçları */}
                        <div className="py-1">
                            <CompactMenuItem
                                icon="fa-broom"
                                label="Verileri Sıfırla"
                                color="text-amber-500"
                                onClick={clearAll}
                            />
                            <CompactMenuItem
                                icon="fa-trash-can"
                                label="Ölçümleri Sil"
                                color="text-rose-500"
                                onClick={resetDistance}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Buffer Modal */}
            {showBufferModal && (
                <div className="fixed inset-0 bg-black/30 z-[10003] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[300px] overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100">
                        <div className="px-4 py-3 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                                <i className="fa-solid fa-circle-dot text-purple-500"></i>
                                Etki Alanı Analizi
                            </h3>
                            <button onClick={() => setShowBufferModal(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Katman</label>
                                <select
                                    className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                    value={selectedLayerId}
                                    onChange={e => setSelectedLayerId(e.target.value)}
                                >
                                    <option value="">Seçiniz</option>
                                    {items.filter(i => i.visible).map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Mesafe</label>
                                    <input
                                        type="number"
                                        value={bufferRadius}
                                        onChange={e => setBufferRadius(Number(e.target.value))}
                                        className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase ml-0.5">Birim</label>
                                    <select
                                        value={bufferUnit}
                                        onChange={e => setBufferUnit(e.target.value as any)}
                                        className="w-full h-8 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="meters">Metre</option>
                                        <option value="kilometers">Kilometre</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-zinc-50/50 flex gap-2">
                            <button
                                onClick={() => setShowBufferModal(false)}
                                className="flex-1 h-8 text-xs font-medium text-zinc-500 hover:bg-zinc-200 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleBufferAnalyze}
                                disabled={!selectedLayerId}
                                className="flex-[2] h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                            >
                                Analiz Yap
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Compact List MenuItem
 */
function CompactMenuItem({ icon, label, onClick, active, color, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full flex items-center gap-3 px-3 py-1.5 transition-colors text-left
                ${active
                    ? 'bg-blue-50 text-blue-600'
                    : disabled
                        ? 'opacity-40 cursor-not-allowed text-zinc-400'
                        : 'hover:bg-zinc-50 text-zinc-700 cursor-pointer'
                }
            `}
        >
            <i className={`fa-solid ${icon} ${active ? 'text-blue-600' : color} w-4 text-center text-[12px]`}></i>
            <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'} truncate`}>{label}</span>
            {active && <div className="ml-auto w-1 h-1 rounded-full bg-blue-600"></div>}
            {disabled && <span className="ml-auto text-[8px] bg-zinc-100 text-zinc-400 px-1 py-0.5 rounded uppercase">Yakında</span>}
        </button>
    )
}
