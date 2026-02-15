/**
 * Distance Tool Display Components
 * UI components for measurement display
 */

interface MeasurementPanelProps {
  isClosed: boolean
  perimeterValue: number
  measurementValue: number
  tempTotalDistance: number
  isDrawingDistance: boolean
  formatDistance: (val: number) => string
  formatArea: (val: number) => string
  onReset: () => void
}

export function MeasurementPanel({
  isClosed,
  perimeterValue,
  measurementValue,
  tempTotalDistance,
  isDrawingDistance,
  formatDistance,
  formatArea,
  onReset,
}: MeasurementPanelProps) {
  return (
    <>
      <style>{`
        @keyframes slideDownFade {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      <div
        className="fixed top-[70px] left-1/2 transform -translate-x-1/2 flex items-center gap-[8px] z-2001 font-sans pointer-events-auto"
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '7px 11px',
          borderRadius: '8px',
          boxShadow: '0 3px 14px rgba(0, 0, 0, 0.3)',
          minHeight: '31px',
          animation: 'slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <button
          onClick={onReset}
          className="flex items-center gap-[4px] text-white/70 text-[10px] font-medium px-[6px] py-[3px] rounded-[4px] hover:bg-white/10 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
        >
          ESC
        </button>

        <div className="w-px h-[17px] bg-white/20"></div>

        {isClosed ? (
          <div className="flex items-center gap-[8px]">
            <div className="flex items-center gap-[6px]">
              <span className="text-white/60 text-[10px] font-normal">Çevre</span>
              <span className="text-white text-[11px] font-bold tracking-[0.3px]">{formatDistance(perimeterValue)}</span>
            </div>
            <div className="w-px h-[17px] bg-white/20"></div>
            <div className="flex items-center gap-[6px]">
              <span className="text-white/60 text-[10px] font-normal">Alan</span>
              <span className="text-white text-[13px] font-bold tracking-[0.3px]">{formatArea(measurementValue)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-[6px]">
            <span className="text-white/60 text-[10px] font-normal">Mesafe</span>
            <span className="text-white text-[13px] font-bold tracking-[0.3px]">
              {isDrawingDistance
                ? formatDistance(tempTotalDistance)
                : formatDistance(measurementValue)
              }
            </span>
          </div>
        )}
      </div>
    </>
  )
}
