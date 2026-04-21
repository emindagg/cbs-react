import { LAND_COVER_LEGEND_ITEMS } from '../hooks/useOverlayLayers'

interface LandCoverLegendProps {
  isVisible: boolean
}

export function LandCoverLegend({ isVisible }: LandCoverLegendProps) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-20 right-3 z-1200 w-[260px] max-w-[78vw] rounded-lg border border-white/20 bg-black/45 p-3 shadow-lg backdrop-blur-[1px]">
      <h3 className="mb-2 text-[13px] font-semibold text-white">Arazi Örtüsü</h3>
      <div className="space-y-1.5">
        {LAND_COVER_LEGEND_ITEMS.map((item) => (
          <div key={item.code} className="flex items-center gap-2 text-[13px] leading-none font-semibold text-white">
            <span className="h-5 w-5 shrink-0 rounded-[2px] border border-white/20" style={{ backgroundColor: item.color }} />
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
