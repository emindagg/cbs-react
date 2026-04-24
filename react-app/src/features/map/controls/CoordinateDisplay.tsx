import { useCoordinateDisplay } from '../hooks/useCoordinateDisplay'

interface CoordinateDisplayProps {
  /** Sidebar durumuna göre AppLayout'tan gelen dinamik left değeri */
  leftPosition: string
  /** Mobilde sidebar açıkken true — kartı gizler */
  hidden?: boolean
}

/**
 * CoordinateDisplay
 *
 * Harita üzerinde mouse gezindikçe anlık koordinatları sol-alt köşede gösterir.
 * Mantığı useCoordinateDisplay hook'unda yaşar; bu bileşen yalnızca UI'dır.
 *
 * AppLayout'ta fixed pozisyonlu olarak render edilir.
 * Sidebar açıldığında leftPosition prop'u güncellenerek sidebar'ın altına
 * girmesi önlenir.
 */
export function CoordinateDisplay({ leftPosition, hidden = false }: CoordinateDisplayProps) {
  const { coords, isVisible } = useCoordinateDisplay()

  if (!coords || hidden) return null

  return (
    <div
      id="coordinate-display"
      data-export-ignore="true"
      className="fixed bottom-3 z-[1400] pointer-events-none transition-all duration-300 ease-out"
      style={{
        left: leftPosition,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 text-zinc-800 font-mono text-[11px] font-bold select-none drop-shadow-[0_2px_4px_rgba(255,255,255,1)]">
        <i className="fa-solid fa-map-pin text-zinc-600 text-[10px]" />
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-900">{coords.lat.toFixed(5)}</span>
          <span className="text-zinc-500">,</span>
          <span className="text-zinc-900">{coords.lng.toFixed(5)}</span>
        </div>
      </div>
    </div>
  )
}

export default CoordinateDisplay
