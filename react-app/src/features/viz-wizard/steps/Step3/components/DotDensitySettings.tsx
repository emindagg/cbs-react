/**
 * Dot Density Settings
 * Controls: dot value (input), dot size (slider), dots-represent label
 */

import type { VisualizationSettings } from '@/types/visualization'
import { DotColorPicker } from './DotColorPicker'

interface DotDensitySettingsProps {
    vizSettings: VisualizationSettings
    setVizSettings: (settings: Partial<VisualizationSettings>) => void
    dataValues: number[]
}


/**
 * Calculate a "smart" dot value suggestion based on data characteristics
 */
function calculateSmartDotValue(dataValues: number[]): number {
    if (dataValues.length === 0) return 1

    const totalValue = dataValues.reduce((sum, v) => sum + Math.abs(v), 0)
    const avgValue = totalValue / dataValues.length

    // Target ~3000-6000 total dots for good visual density
    const targetDots = Math.min(5000, dataValues.length * 40)
    const raw = totalValue / targetDots

    // Round to a "nice" number (1, 2, 5, 10, 20, 50, 100, 200, 500, ...)
    if (raw <= 1) return 1
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
    const normalized = raw / magnitude
    let nice: number
    if (normalized <= 1.5) nice = 1
    else if (normalized <= 3.5) nice = 2
    else if (normalized <= 7.5) nice = 5
    else nice = 10
    const result = nice * magnitude

    // Don't let it exceed average value (at least 1 dot per region)
    return Math.max(1, Math.min(Math.round(result), Math.round(avgValue)))
}

export function DotDensitySettings({
    vizSettings,
    setVizSettings,
    dataValues,
}: DotDensitySettingsProps) {
    const totalValue = dataValues.reduce((sum, v) => sum + Math.abs(v), 0)

    // Smart auto-calculated suggestion
    const smartDotValue = calculateSmartDotValue(dataValues)
    const effectiveDotValue = vizSettings.dotValue ?? smartDotValue
    const currentDotSize = vizSettings.dotSize ?? 2.4
    const currentDotLabel = vizSettings.dotLabel ?? ''
    const currentDotColor = vizSettings.dotColor ?? '#2d6a4f'

    const dotCount = effectiveDotValue > 0 ? Math.round(totalValue / effectiveDotValue) : 0

    const handleDotValueChange = (raw: string) => {
        // Allow clearing (revert to auto)
        if (raw === '') {
            setVizSettings({ dotValue: undefined })
            return
        }
        const num = parseInt(raw.replace(/\./g, '').replace(/,/g, ''), 10)
        if (!isNaN(num) && num >= 1) {
            setVizSettings({ dotValue: num })
        }
    }

    return (
        <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-4">
            <h4 className="text-[11px] font-semibold text-zinc-700">Nokta Yoğunluğu</h4>

            {/* Dots Represent Label */}
            <div>
                <label className="text-[10px] font-medium text-zinc-600 mb-1 block">
                    Noktaların temsil ettikleri
                </label>
                <input
                    type="text"
                    value={currentDotLabel}
                    onChange={(e) => setVizSettings({ dotLabel: e.target.value })}
                    placeholder="ör. Nüfus, Satış, Öğrenci"
                    className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
            </div>

            {/* Dot Color */}
            <div>
                <label className="text-[10px] font-medium text-zinc-600 mb-1.5 block">
                    Simge stili
                </label>
                <div className="flex items-center gap-2">
                    <DotColorPicker
                        color={currentDotColor}
                        onChange={(color) => setVizSettings({ dotColor: color })}
                    />
                    <span className="text-[10px] text-zinc-500">
                        Nokta rengi seçin
                    </span>
                </div>
            </div>

            {/* Dot Value — free input */}
            <div>
                <label className="text-[10px] font-medium text-zinc-600 mb-1 block">
                    Nokta değeri
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">1 nokta =</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={vizSettings.dotValue !== undefined ? vizSettings.dotValue.toLocaleString('tr-TR') : ''}
                        onChange={(e) => handleDotValueChange(e.target.value)}
                        placeholder={smartDotValue.toLocaleString('tr-TR')}
                        className="flex-1 px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all tabular-nums"
                    />
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {currentDotLabel || 'birim'}
                    </span>
                </div>

                {/* Smart suggestion chip */}
                {vizSettings.dotValue === undefined && (
                    <div className="mt-1.5 flex items-center gap-1">
                        <i className="fa-solid fa-wand-magic-sparkles text-[9px] text-amber-500"></i>
                        <span className="text-[9px] text-amber-600">
                            Akıllı öneri: {smartDotValue.toLocaleString('tr-TR')} (otomatik)
                        </span>
                    </div>
                )}

                {vizSettings.dotValue !== undefined && (
                    <button
                        onClick={() => setVizSettings({ dotValue: undefined })}
                        className="mt-1.5 flex items-center gap-1 text-[9px] text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                        <i className="fa-solid fa-rotate-left text-[8px]"></i>
                        Otomatiğe dön ({smartDotValue.toLocaleString('tr-TR')})
                    </button>
                )}

                {/* Dot value info box */}
                <div className="mt-2 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-md">
                    <p className="text-[10px] text-blue-700 font-medium text-center">
                        1 nokta = {effectiveDotValue.toLocaleString('tr-TR')}
                        {currentDotLabel ? ` ${currentDotLabel}` : ' birim'}
                    </p>
                    <p className="text-[9px] text-blue-500 text-center mt-0.5">
                        Toplam ~{dotCount.toLocaleString('tr-TR')} nokta haritada görünecek
                    </p>
                </div>
            </div>

            {/* Dot Size */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-medium text-zinc-600">Nokta boyutu</label>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min={0.5}
                            max={10}
                            step={0.1}
                            value={currentDotSize}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                if (!isNaN(val) && val >= 0.5 && val <= 10) {
                                    setVizSettings({ dotSize: val })
                                }
                            }}
                            className="w-14 px-1.5 py-0.5 text-[10px] text-center border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[9px] text-zinc-400">px</span>
                    </div>
                </div>

                <input
                    type="range"
                    min={0.5}
                    max={10}
                    step={0.1}
                    value={currentDotSize}
                    onChange={(e) => setVizSettings({ dotSize: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>
        </div>
    )
}
