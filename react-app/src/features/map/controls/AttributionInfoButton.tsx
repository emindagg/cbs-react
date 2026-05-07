import { useEffect, useRef, useState } from 'react'

export default function AttributionInfoButton() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="fixed bottom-3 right-3 z-10002" data-export-ignore="true" ref={panelRef}>
      {isOpen && (
        <div className="mb-2 w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-white/40 bg-white/40 backdrop-blur-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <div className="space-y-1.5 text-[11px] text-zinc-700 leading-relaxed">
            <p>© HGM - Harita Genel Müdürlüğü</p>
            <p>© openrouteservice.org | © OSM contributors</p>
            <p>© European Union, Copernicus Land Monitoring Service</p>
            <p>AWS Terrarium DEM</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-center h-6 w-6 rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all ${isOpen ? 'bg-zinc-100 border-zinc-300 text-zinc-800' : 'bg-white/40 backdrop-blur-xl border-white/40 text-zinc-600 hover:bg-white/60 hover:text-zinc-900'}`}
        aria-label="Atıf bilgisini göster"
      >
        <i className="fa-solid fa-info text-[10px]" />
      </button>
    </div>
  )
}
