/**
 * Legend title section: show checkbox, text input, fontSize (LegendConfig içinde kullanılır)
 */

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

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium text-zinc-600">Başlık</label>
        <input
          type="checkbox"
          checked={show}
          onChange={(e) =>
            onChange({
              title: { show: e.target.checked, text, fontSize },
            })
          }
          className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
        />
      </div>
      {show && (
        <>
          <input
            type="text"
            value={text}
            onChange={(e) => onChange({ title: { show: true, text: e.target.value, fontSize } })}
            placeholder="Lejant başlığı..."
            className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
          />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-zinc-500">Yazı Boyutu</label>
              <span className="text-[10px] text-zinc-400">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={TITLE_FONT_SIZE_MIN}
                max={TITLE_FONT_SIZE_MAX}
                step={1}
                value={fontSize}
                onChange={(e) =>
                  onChange({ title: { show: true, text, fontSize: Number.parseInt(e.target.value) } })
                }
                className="flex-1"
              />
              <input
                type="number"
                min={TITLE_FONT_SIZE_MIN}
                max={TITLE_FONT_SIZE_MAX}
                value={fontSize}
                onChange={(e) =>
                  onChange({ title: { show: true, text, fontSize: Number.parseInt(e.target.value) } })
                }
                className="w-14 px-2 py-1 text-[10px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
