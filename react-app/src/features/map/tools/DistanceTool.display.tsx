/**
 * Distance Tool Display Components
 * UI components for measurement display
 */

import { forwardRef, memo, useImperativeHandle, useRef } from 'react'

export interface MeasurementPanelHandle {
  updateLive: (tempTotal: number, tempSegment: number) => void
}

interface MeasurementPanelProps {
  isClosed: boolean
  perimeterValue: number
  measurementValue: number
  isDrawingDistance: boolean
  formatDistance: (val: number) => string
  formatArea: (val: number) => string
  onReset: () => void
  onUndo: () => void
  canUndo: boolean
}

export const MeasurementPanel = memo(forwardRef<MeasurementPanelHandle, MeasurementPanelProps>(
  function MeasurementPanel({
    isClosed,
    perimeterValue,
    measurementValue,
    isDrawingDistance,
    formatDistance,
    formatArea,
    onReset,
    onUndo,
    canUndo,
  }, ref) {
    const tempTotalRef = useRef<HTMLSpanElement>(null)
    const tempSegmentRef = useRef<HTMLSpanElement>(null)

    useImperativeHandle(ref, () => ({
      updateLive: (tempTotal, tempSegment) => {
        if (tempTotalRef.current) {
          tempTotalRef.current.textContent = formatDistance(tempTotal)
        }
        if (tempSegmentRef.current) {
          tempSegmentRef.current.textContent = `+${formatDistance(tempSegment)}`
        }
      },
    }), [formatDistance])

    const hasConfirmedDistance = measurementValue > 0
    const showTempSegment = isDrawingDistance && hasConfirmedDistance

    return (
      <>
        <style>{`
          @keyframes slideDownFade {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div className="fixed top-[68px] left-0 right-0 flex justify-center px-3 z-2001 pointer-events-none font-sans">
        <div
          className="flex items-center gap-[6px] pointer-events-auto"
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

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-[3px] text-[8px] font-semibold px-[5px] py-[2px] rounded-[4px] transition-colors border-none cursor-pointer ${
              canUndo
                ? 'text-white/70 hover:bg-white/10 hover:text-white bg-transparent'
                : 'text-white/30 bg-transparent cursor-not-allowed'
            }`}
            title="Son noktayı geri al"
          >
            ↶
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
              {showTempSegment ? (
                <>
                  <span className="text-white text-[11px] font-bold tracking-[0.2px]">
                    {formatDistance(measurementValue)}
                  </span>
                  <span
                    ref={tempSegmentRef}
                    className="text-slate-300/90 text-[9px] font-semibold tracking-[0.1px]"
                  >
                    +{formatDistance(0)}
                  </span>
                </>
              ) : (
                <span
                  ref={tempTotalRef}
                  className="text-white text-[11px] font-bold tracking-[0.2px]"
                >
                  {isDrawingDistance ? formatDistance(0) : formatDistance(measurementValue)}
                </span>
              )}
            </div>
          )}
        </div>
        </div>
      </>
    )
  },
))
