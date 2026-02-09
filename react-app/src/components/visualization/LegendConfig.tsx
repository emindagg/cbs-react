/**
 * Legend Configuration Panel
 * Datawrapper-style legend settings interface
 */

import { LegendConfigLabelsSection } from './LegendConfigLabelsSection'
import { LegendConfigSizeSection } from './LegendConfigSizeSection'
import { LegendConfigTitleSection } from './LegendConfigTitleSection'
import type { LegendConfiguration } from '../../types/visualization'
import { FORMAT_OPTIONS } from '../../utils/numberFormatter'

interface LegendConfigProps {
  config: LegendConfiguration;
  onChange: (config: Partial<LegendConfiguration>) => void;
}

export default function LegendConfig({ config, onChange }: LegendConfigProps) {
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

      {config.visible && (
        <>
          <LegendConfigSizeSection config={config} onChange={onChange} />

          {/* Orientation */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
              Yönlendirme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ orientation: 'horizontal' })}
                className={`
                  flex-1 px-3 py-2 text-[11px] rounded border transition-all
                  ${
        config.orientation === 'horizontal'
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
        }
                `}
              >
                Yatay
              </button>
              <button
                onClick={() => onChange({ orientation: 'vertical' })}
                className={`
                  flex-1 px-3 py-2 text-[11px] rounded border transition-all
                  ${
        config.orientation === 'vertical'
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
        }
                `}
              >
                Dikey
              </button>
            </div>
          </div>

          <LegendConfigLabelsSection config={config} onChange={onChange} />

          {/* Format */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
              Sayı Formatı
            </label>
            <select
              value={config.format}
              onChange={(e) => onChange({ format: e.target.value })}
              className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.example}
                </option>
              ))}
            </select>
          </div>

          <LegendConfigTitleSection config={config} onChange={onChange} />

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
