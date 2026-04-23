/**
 * Custom Range Configuration
 * Allows manual setting of min, center, and max values for color scale
 */

import type { CustomRange } from '@/types/visualization'

import { CustomRangeConfigFields } from './ConfigFields'
import { useCustomRange } from './useCustomRange'

interface CustomRangeConfigProps {
  customRange: CustomRange
  autoMin: number
  autoMax: number
  onChange: (range: CustomRange) => void
}

export default function CustomRangeConfig({
  customRange,
  autoMin,
  autoMax,
  onChange,
}: CustomRangeConfigProps) {
  const {
    localMin,
    localCenter,
    localMax,
    errors,
    validateAndUpdate,
    toggleEnabled,
  } = useCustomRange(customRange, onChange)

  const autoCenter = (autoMin + autoMax) / 2

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium text-zinc-600">Özel Aralık</label>
          <button
            type="button"
            className="w-3.5 h-3.5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-400 text-[9px]"
            title="Min, Orta ve Maks değerleri manuel ayarlayarak renk paletini belirli bir aralığa sabitleyin."
          >
            ?
          </button>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={customRange.enabled}
          onClick={toggleEnabled}
          className="relative w-12 h-6 cursor-pointer flex items-center justify-center group/neur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 rounded-sm"
        >
          <div className={`w-full h-[2px] rounded-full transition-colors duration-500 ${customRange.enabled ? 'bg-zinc-900' : 'bg-zinc-300 group-hover/neur:bg-zinc-400'}`} />
          <div className={`absolute w-3.5 h-3.5 border transition-all duration-500 ease-in-out ${
            customRange.enabled ? 'translate-x-4 bg-zinc-900 border-zinc-900 rotate-45 scale-110 shadow-md' : '-translate-x-4 bg-white border-zinc-400 rotate-0 scale-100 shadow-sm group-hover/neur:border-zinc-500 group-hover/neur:shadow'
          }`} />
        </button>
      </div>

      {customRange.enabled && (
        <div className="space-y-2.5">
          <div>
            <label className="text-[10px] font-medium text-zinc-600 mb-1 block">Aralık Dışı Gösterim</label>
            <select
              value={customRange.outOfRangeMode ?? 'gray'}
              onChange={(e) =>
                onChange({
                  ...customRange,
                  outOfRangeMode: e.target.value as 'gray' | 'transparent',
                })
              }
              className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="gray">Gri boya</option>
              <option value="transparent">Şeffaf (gizle)</option>
            </select>
          </div>

          <CustomRangeConfigFields
            localMin={localMin}
            localCenter={localCenter}
            localMax={localMax}
            errors={errors}
            onValidateAndUpdate={validateAndUpdate}
            autoMin={autoMin}
            autoCenter={autoCenter}
            autoMax={autoMax}
          />
        </div>
      )}
    </div>
  )
}
