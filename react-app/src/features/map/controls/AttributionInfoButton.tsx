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
        <div className="mb-2 w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-zinc-200 bg-white/95 backdrop-blur p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <div className="space-y-1.5 text-[11px] text-zinc-700 leading-relaxed">
            <p>© HGM - Harita Genel Müdürlüğü</p>
            <p>© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors</p>
            <p>© European Union, Copernicus Land Monitoring Service</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-center h-6 w-6 rounded-full border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-colors ${isOpen ? 'bg-zinc-100 text-zinc-800' : 'bg-white/90 text-zinc-500 hover:bg-white hover:text-zinc-800'}`}
        aria-label="Atıf bilgisini göster"
      >
        <i className="fa-solid fa-info text-[10px]" />
      </button>
    </div>
  )
}
