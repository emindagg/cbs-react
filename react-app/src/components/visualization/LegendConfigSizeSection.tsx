/**
 * Legend size slider section (LegendConfig içinde kullanılır)
 */

import type { LegendConfiguration } from '../../types/visualization'

const SIZE_MIN = 50
const SIZE_MAX = 300
const SIZE_STEP = 10

interface LegendConfigSizeSectionProps {
  config: LegendConfiguration
  onChange: (config: Partial<LegendConfiguration>) => void
}

export function LegendConfigSizeSection({ config, onChange }: LegendConfigSizeSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium text-zinc-600">Boyut</label>
        <span className="text-[10px] text-zinc-400">{config.size}px</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={SIZE_MIN}
          max={SIZE_MAX}
          step={SIZE_STEP}
          value={config.size}
          onChange={(e) => onChange({ size: Number.parseInt(e.target.value) })}
          className="flex-1"
        />
        <input
          type="number"
          min={SIZE_MIN}
          max={SIZE_MAX}
          value={config.size}
          onChange={(e) => onChange({ size: Number.parseInt(e.target.value) })}
          className="w-16 px-2 py-1 text-[11px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
