/**
 * Harita başlığı ayarları paneli (VizWizardStep3 içinde kullanılır)
 */

import { SliderWithInput } from '@/components/ui'
import type { MapTitleConfiguration } from '@/types/visualization'

interface MapTitleSectionProps {
  mapTitle: MapTitleConfiguration
  setMapTitle: (config: Partial<MapTitleConfiguration>) => void
  expanded: boolean
  onToggle: () => void
}

export function MapTitleSection({
  mapTitle,
  setMapTitle,
  expanded,
  onToggle,
}: MapTitleSectionProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-heading text-[10px] text-zinc-500" />
          <span className="text-[11px] font-semibold text-zinc-700">Harita Başlığı</span>
        </div>
        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-[9px] text-zinc-400`} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-zinc-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-zinc-600">Başlığı Göster</label>
            <button
              type="button"
              role="switch"
              aria-checked={mapTitle.visible}
              onClick={() => setMapTitle({ visible: !mapTitle.visible })}
              className="relative w-12 h-6 cursor-pointer flex items-center justify-center group/neur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 rounded-sm"
            >
              <div className={`w-full h-[2px] rounded-full transition-colors duration-500 ${mapTitle.visible ? 'bg-zinc-900' : 'bg-zinc-300 group-hover/neur:bg-zinc-400'}`} />
              <div className={`absolute w-3.5 h-3.5 border transition-all duration-500 ease-in-out ${
                mapTitle.visible ? 'translate-x-4 bg-zinc-900 border-zinc-900 rotate-45 scale-110 shadow-md' : '-translate-x-4 bg-white border-zinc-400 rotate-0 scale-100 shadow-sm group-hover/neur:border-zinc-500 group-hover/neur:shadow'
              }`} />
            </button>
          </div>

          {mapTitle.visible && (
            <>
              <SliderWithInput
                label="Yazı Boyutu"
                min={5}
                max={55}
                step={1}
                value={mapTitle.fontSize ?? 24}
                onChange={(fontSize) => setMapTitle({ fontSize })}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-[10px] text-blue-700">
                  💡 Başlığı düzenlemek için harita üzerinde tıklayın
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
