/**
 * Harita başlığı ayarları paneli (VizWizardStep3 içinde kullanılır)
 */

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
              onClick={() => setMapTitle({ visible: !mapTitle.visible })}
              className={`
                w-12 h-6 rounded-full transition-all relative
                ${mapTitle.visible ? 'bg-blue-500' : 'bg-zinc-300'}
              `}
            >
              <div
                className={`
                  w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all
                  ${mapTitle.visible ? 'left-6' : 'left-0.5'}
                `}
              />
            </button>
          </div>

          {mapTitle.visible && (
            <>
              <div>
                <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
                  Pozisyon
                </label>
                <select
                  value={mapTitle.position}
                  onChange={(e) =>
                    setMapTitle({ position: e.target.value as 'top-left' | 'top-center' | 'top-right' })
                  }
                  className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="top-left">Sol Üst</option>
                  <option value="top-center">Orta Üst</option>
                  <option value="top-right">Sağ Üst</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-zinc-600">Yazı Boyutu</label>
                  <span className="text-[10px] text-zinc-400">{mapTitle.fontSize ?? 24}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={5}
                    max={55}
                    step={1}
                    value={mapTitle.fontSize ?? 24}
                    onChange={(e) => setMapTitle({ fontSize: Number.parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min={5}
                    max={55}
                    value={mapTitle.fontSize ?? 24}
                    onChange={(e) => setMapTitle({ fontSize: Number.parseInt(e.target.value) })}
                    className="w-14 px-2 py-1 text-[10px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

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
