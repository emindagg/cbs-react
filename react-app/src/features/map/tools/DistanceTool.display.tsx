/**
 * Distance Tool Display Components
 * UI components for measurement display
 */

interface MeasurementPanelProps {
  isClosed: boolean
  perimeterValue: number
  measurementValue: number
  tempTotalDistance: number
  tempSegmentDistance: number
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
  tempSegmentDistance,
  isDrawingDistance,
  formatDistance,
  formatArea,
  onReset,
}: MeasurementPanelProps) {
  const showTempSegment = isDrawingDistance && tempSegmentDistance > 0
  const hasConfirmedDistance = measurementValue > 0

  return (
    <>
      <style>{`
        @keyframes slideDownFade {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      <div
        className="fixed top-[68px] left-1/2 transform -translate-x-1/2 flex items-center gap-[6px] z-2001 font-sans pointer-events-auto"
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '6px 9px',
          borderRadius: '7px',
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.28)',
          minHeight: '25px',
          animation: 'slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <button
          onClick={onReset}
          className="flex items-center gap-[3px] text-white/70 text-[8px] font-semibold px-[5px] py-[2px] rounded-[4px] hover:bg-white/10 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
        >
          ESC
        </button>

        <div className="w-px h-[14px] bg-white/20"></div>

        {isClosed ? (
          <div className="flex items-center gap-[6px]">
            <div className="flex items-center gap-[5px]">
              <span className="text-white/60 text-[8px] font-normal">Çevre</span>
              <span className="text-white text-[10px] font-bold tracking-[0.2px]">{formatDistance(perimeterValue)}</span>
            </div>
            <div className="w-px h-[14px] bg-white/20"></div>
            <div className="flex items-center gap-[5px]">
              <span className="text-white/60 text-[8px] font-normal">Alan</span>
              <span className="text-white text-[11px] font-bold tracking-[0.2px]">{formatArea(measurementValue)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-[5px]">
            <span className="text-white/60 text-[8px] font-normal">Mesafe</span>
            {showTempSegment && hasConfirmedDistance ? (
              <>
                <span className="text-white text-[11px] font-bold tracking-[0.2px]">
                  {formatDistance(measurementValue)}
                </span>
                <span className="text-slate-300/90 text-[9px] font-semibold tracking-[0.1px]">
                  +{formatDistance(tempSegmentDistance)}
                </span>
              </>
            ) : (
              <span className="text-white text-[11px] font-bold tracking-[0.2px]">
                {isDrawingDistance
                  ? formatDistance(tempTotalDistance)
                  : formatDistance(measurementValue)
                }
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )
}
