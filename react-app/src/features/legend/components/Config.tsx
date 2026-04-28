/**
 * Legend Configuration Panel
 */

import { SingleSlider, SliderWithInput } from '@/components/ui'
import { NORTH_ARROW_STYLES } from '@/shared/northArrowStyles'
import { useMapStore } from '@/stores/useMapStore'
import type { LegendConfiguration } from '@/types/visualization'
import { coerceNumberFormat, FORMAT_OPTIONS } from '@/utils/numberFormatter'

import { ConfigLabelsSection } from './ConfigLabelsSection'
import { ConfigSizeSection } from './ConfigSizeSection'
import { ConfigTitleSection } from './ConfigTitleSection'

const TOGGLE_BUTTON_CLASS =
  'relative w-10 h-5 cursor-pointer flex items-center justify-center group/neur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 rounded-sm'
const TOGGLE_TRACK_CLASS = 'w-full h-[2px] rounded-full transition-colors duration-500'
const TOGGLE_KNOB_CLASS = 'absolute w-3 h-3 border transition-all duration-500 ease-in-out'

interface LegendConfigProps {
  config: LegendConfiguration;
  onChange: (config: Partial<LegendConfiguration>) => void;
  classCount: number;
}

export default function LegendConfig({ config, onChange, classCount }: LegendConfigProps) {
  const {
    northArrowVisible, setNorthArrowVisible,
    northArrowStyle, setNorthArrowStyle,
    northArrowBearing, setNorthArrowBearing,
    northArrowSize, setNorthArrowSize,
  } = useMapStore()

  return (
    <div className="space-y-4">
      {/* Lejant Card */}
      <div className="border border-zinc-200 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-zinc-700">Lejantı Göster</label>
          <button
            type="button"
            role="switch"
            aria-checked={config.visible}
            onClick={() => onChange({ visible: !config.visible })}
            className={TOGGLE_BUTTON_CLASS}
          >
            <div className={`${TOGGLE_TRACK_CLASS} ${config.visible ? 'bg-zinc-900' : 'bg-zinc-300 group-hover/neur:bg-zinc-400'}`} />
            <div className={`${TOGGLE_KNOB_CLASS} ${
              config.visible ? 'translate-x-3 bg-zinc-900 border-zinc-900 rotate-45 scale-110 shadow-md' : '-translate-x-3 bg-white border-zinc-400 rotate-0 scale-100 shadow-sm group-hover/neur:border-zinc-500 group-hover/neur:shadow'
            }`} />
          </button>
        </div>

        {config.visible && (
          <>
            <hr className="border-zinc-200" />
            <div className="space-y-3">
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
                    checked={config.reverseOrder}
                    onChange={(e) => onChange({ reverseOrder: e.target.checked })}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-zinc-600">
                    Lejant sırasını tersine çevir
                  </span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Yön Oku Card */}
      <div className="border border-zinc-200 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-zinc-700">Yön Oku</label>
          <button
            type="button"
            role="switch"
            aria-checked={northArrowVisible}
            onClick={() => setNorthArrowVisible(!northArrowVisible)}
            className={TOGGLE_BUTTON_CLASS}
          >
            <div className={`${TOGGLE_TRACK_CLASS} ${northArrowVisible ? 'bg-zinc-900' : 'bg-zinc-300 group-hover/neur:bg-zinc-400'}`} />
            <div className={`${TOGGLE_KNOB_CLASS} ${
              northArrowVisible ? 'translate-x-3 bg-zinc-900 border-zinc-900 rotate-45 scale-110 shadow-md' : '-translate-x-3 bg-white border-zinc-400 rotate-0 scale-100 shadow-sm group-hover/neur:border-zinc-500 group-hover/neur:shadow'
            }`} />
          </button>
        </div>

        {northArrowVisible && (
          <>
            <hr className="border-zinc-200" />
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
                  Modeli
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
              <div>
                <SingleSlider
                  label="Pusula Yönü"
                  min={0}
                  max={360}
                  step={1}
                  value={northArrowBearing}
                  formatValue={(v) => `${v}°`}
                  onChange={setNorthArrowBearing}
                />
                <div className="flex justify-between text-[9px] text-zinc-400 mt-0.5">
                  <span>0° (K)</span><span>180° (G)</span><span>360°</span>
                </div>
              </div>
              <SliderWithInput
                label="Boyut"
                min={30}
                max={200}
                step={2}
                value={northArrowSize}
                onChange={setNorthArrowSize}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
