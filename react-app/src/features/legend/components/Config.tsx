/**
 * Legend Configuration Panel
 */

import type { LegendConfiguration } from '@/types/visualization'
import { NORTH_ARROW_STYLES } from '@/shared/northArrowStyles'
import { coerceNumberFormat, FORMAT_OPTIONS } from '@/utils/numberFormatter'
import { useMapStore } from '@/stores/useMapStore'

import { ConfigLabelsSection } from './ConfigLabelsSection'
import { ConfigSizeSection } from './ConfigSizeSection'
import { ConfigTitleSection } from './ConfigTitleSection'

interface LegendConfigProps {
  config: LegendConfiguration;
  onChange: (config: Partial<LegendConfiguration>) => void;
  classCount: number;
}

export default function LegendConfig({ config, onChange, classCount }: LegendConfigProps) {
  const { northArrowVisible, setNorthArrowVisible, northArrowStyle, setNorthArrowStyle } = useMapStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">Lejantı Göster</label>
        <button
          type="button"
          onClick={() => onChange({ visible: !config.visible })}
          className={`w-12 h-6 rounded-full transition-all relative ${config.visible ? 'bg-blue-500' : 'bg-zinc-300'}`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${config.visible ? 'left-6' : 'left-0.5'}`}
          />
        </button>
      </div>

      <hr className="border-zinc-200" />

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">Yön Oku</label>
        <button
          type="button"
          onClick={() => setNorthArrowVisible(!northArrowVisible)}
          className={`w-12 h-6 rounded-full transition-all relative ${northArrowVisible ? 'bg-blue-500' : 'bg-zinc-300'}`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${northArrowVisible ? 'left-6' : 'left-0.5'}`}
          />
        </button>
      </div>

      {northArrowVisible && (
        <div>
          <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
            Yön Oku Modeli
          </label>
          <select
            value={northArrowStyle}
            onChange={(e) => setNorthArrowStyle(e.target.value as Parameters<typeof setNorthArrowStyle>[0])}
            className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {(Object.entries(NORTH_ARROW_STYLES) as [Parameters<typeof setNorthArrowStyle>[0], { label: string }][]).map(([id, { label }]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {config.visible && (
        <>
          <ConfigSizeSection config={config} onChange={onChange} />

          {/* Orientation */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
              Yönlendirme
            </label>
            <div className="flex rounded-md border border-zinc-200 overflow-hidden">
              {([['horizontal', 'Yatay'], ['vertical', 'Dikey']] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ orientation: value })}
                  className={`flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                    config.orientation === value
                      ? 'bg-zinc-800 text-white'
                      : 'bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ConfigLabelsSection config={config} onChange={onChange} classCount={classCount} />

          {/* Format */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
              Sayı Formatı
            </label>
            <select
              value={config.format}
              onChange={(e) => onChange({ format: coerceNumberFormat(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.example}
                </option>
              ))}
            </select>
          </div>

          <ConfigTitleSection config={config} onChange={onChange} />

          {/* Advanced Options */}
          <div className="space-y-2 pt-2 border-t border-zinc-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.highlightOnHover}
                onChange={(e) => onChange({ highlightOnHover: e.target.checked })}
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
              <span className="text-[11px] text-zinc-600">
                Hover'da vurgulama aktif et
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.reverseOrder}
                onChange={(e) => onChange({ reverseOrder: e.target.checked })}
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
              <span className="text-[11px] text-zinc-600">
                Lejant sırasını tersine çevir
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  )
}
