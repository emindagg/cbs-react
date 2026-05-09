/**
 * Legend title section: show checkbox, text input, fontSize (LegendConfig içinde kullanılır)
 */

import { SliderWithInput } from '@/components/ui'
import type { LegendConfiguration } from '@/types/visualization'

const TITLE_FONT_SIZE_DEFAULT = 16
const TITLE_FONT_SIZE_MIN = 5
const TITLE_FONT_SIZE_MAX = 55

interface ConfigTitleSectionProps {
  config: LegendConfiguration
  onChange: (config: Partial<LegendConfiguration>) => void
}

export function ConfigTitleSection({ config, onChange }: ConfigTitleSectionProps) {
  const show = config.title?.show || false
  const text = config.title?.text || ''
  const fontSize = config.title?.fontSize ?? TITLE_FONT_SIZE_DEFAULT
  const wrap = config.title?.wrap ?? false

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium text-zinc-600">Başlık</label>
        <input
          type="checkbox"
          checked={show}
          onChange={(e) =>
            onChange({
              title: { show: e.target.checked, text, fontSize, wrap },
            })
          }
          className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
        />
      </div>
      {show && (
        <>
          <textarea
            value={text}
            onChange={(e) => onChange({ title: { show: true, text: e.target.value, fontSize, wrap } })}
            placeholder="Lejant başlığı..."
            rows={2}
            className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1.5 resize-y"
          />
          <p className="text-[9px] text-zinc-400 mb-2">
            Alt satıra geçmek istediğiniz yerde Enter kullanın.
          </p>
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={wrap}
              onChange={(e) => onChange({ title: { show: true, text, fontSize, wrap: e.target.checked } })}
              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
            />
            <span className="text-[11px] text-zinc-600">
              Uzun başlığı otomatik kaydır
            </span>
          </label>
          <SliderWithInput
            label="Yazı Boyutu"
            min={TITLE_FONT_SIZE_MIN}
            max={TITLE_FONT_SIZE_MAX}
            step={1}
            value={fontSize}
            onChange={(newFontSize) => onChange({ title: { show: true, text, fontSize: newFontSize, wrap } })}
          />
        </>
      )}
    </div>
  )
}
