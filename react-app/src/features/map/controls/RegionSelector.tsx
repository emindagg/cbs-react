import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface SelectionRect {
  x: number
  y: number
  w: number
  h: number
}

interface RegionSelectorProps {
  open: boolean
  title?: string
  confirmLabel?: string
  onConfirm: (rect: SelectionRect | null) => void
  onCancel: () => void
}

const MIN_SIZE = 20

function getAppRoot(): HTMLElement | null {
  return document.getElementById('app-root')
}

/**
 * Kullanıcıya ekrandan dikdörtgen bir alan seçtirir. Seçim #app-root koordinatlarına
 * göre döndürülür; "Tüm Ekranı Al" seçeneği ile null döner.
 */
export function RegionSelector({
  open,
  title = 'Çıktı alacağınız alanı seçin',
  confirmLabel = 'İndir',
  onConfirm,
  onCancel,
}: RegionSelectorProps) {
  const [rect, setRect] = useState<SelectionRect | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setRect(null)
      dragStartRef.current = null
      return
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter' && rect && rect.w >= MIN_SIZE && rect.h >= MIN_SIZE) onConfirm(rect)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, rect, onCancel, onConfirm])

  if (!open) return null

  const toLocal = (clientX: number, clientY: number) => {
    const root = getAppRoot()
    if (!root) return { x: clientX, y: clientY }
    const bounds = root.getBoundingClientRect()
    return { x: clientX - bounds.left, y: clientY - bounds.top }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-region-toolbar]')) return
    if (e.button !== 0) return
    const { x, y } = toLocal(e.clientX, e.clientY)
    dragStartRef.current = { x, y }
    setRect({ x, y, w: 0, h: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartRef.current) return
    const { x: cx, y: cy } = toLocal(e.clientX, e.clientY)
    const start = dragStartRef.current
    setRect({
      x: Math.min(start.x, cx),
      y: Math.min(start.y, cy),
      w: Math.abs(cx - start.x),
      h: Math.abs(cy - start.y),
    })
  }

  const handleMouseUp = () => {
    dragStartRef.current = null
    if (rect && (rect.w < MIN_SIZE || rect.h < MIN_SIZE)) {
      setRect(null)
    }
  }

  const hasRect = !!rect && rect.w >= MIN_SIZE && rect.h >= MIN_SIZE

  // Portal → parent'taki olası `pointer-events-none` zincirini bypass et; böylece
  // fare hareketleri alttaki haritaya değil overlay'e gider.
  const overlay = (
    <div
      data-export-ignore="true"
      className="fixed inset-0 z-[10050] cursor-crosshair select-none"
      style={{ pointerEvents: 'auto' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Dim overlay + seçili alan için delik */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="region-selector-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.45)"
          mask="url(#region-selector-mask)"
        />
        {rect && (
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}
      </svg>

      {/* Boyut etiketi */}
      {hasRect && rect && (
        <div
          className="absolute bg-blue-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-md shadow-sm pointer-events-none"
          style={{
            left: rect.x + rect.w - 4,
            top: rect.y + rect.h + 6,
            transform: 'translateX(-100%)',
          }}
        >
          {Math.round(rect.w)} × {Math.round(rect.h)} px
        </div>
      )}

      {/* Üst bilgi şeridi */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-white text-[12px] px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
        <span className="font-medium">{title}</span>
        <span className="mx-2 opacity-60">•</span>
        <span className="opacity-80">Enter: Onayla</span>
        <span className="mx-2 opacity-60">•</span>
        <span className="opacity-80">Esc: İptal</span>
      </div>

      {/* Eylem çubuğu */}
      <div
        data-region-toolbar="true"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 backdrop-blur rounded-xl shadow-xl p-1.5 border border-zinc-200/80"
      >
        <button
          type="button"
          onClick={() => onConfirm(null)}
          className="px-3 py-1.5 text-[12px] rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors"
        >
          Tüm Ekranı Al
        </button>
        <button
          type="button"
          onClick={() => setRect(null)}
          disabled={!hasRect}
          className="px-3 py-1.5 text-[12px] rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors disabled:opacity-40 disabled:hover:bg-zinc-100"
        >
          Sıfırla
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[12px] rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={() => hasRect && rect && onConfirm(rect)}
          disabled={!hasRect}
          className="px-3 py-1.5 text-[12px] font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
