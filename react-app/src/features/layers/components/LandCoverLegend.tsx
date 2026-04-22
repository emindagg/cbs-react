import { LAND_COVER_LEGEND_ITEMS } from '../hooks/useOverlayLayers'

interface LandCoverLegendProps {
  isVisible: boolean
}

export function LandCoverLegend({ isVisible }: LandCoverLegendProps) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-20 right-3 z-1200 w-[219px] max-w-[78vw] rounded-lg border border-white/20 bg-black/45 px-2 py-1.5 shadow-lg backdrop-blur-[1px]">
      <h3 className="mb-1 text-[13px] font-semibold text-white">Arazi Örtüsü (2018)</h3>
      <div className="space-y-1">
        {LAND_COVER_LEGEND_ITEMS.map((item) => (
          <div
            key={item.code}
            className="flex items-stretch overflow-hidden rounded-[3px] text-[12px] leading-none font-semibold text-white"
          >
            <span className="w-[18px] shrink-0 rounded-[2px] border border-white/20" style={{ backgroundColor: item.color }} />
            <span className="flex-1 truncate px-1.5 py-1">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
