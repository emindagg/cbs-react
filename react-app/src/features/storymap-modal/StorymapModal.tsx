import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useStorymapModalStore } from '@/stores/useStorymapModalStore'

const STORYMAP_URL = `${import.meta.env.BASE_URL}storymap/index.html`
const Z_INDEX = 20000

function resolveStorymapUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${window.location.origin}${import.meta.env.BASE_URL}${url.replace(/^\//, '')}`
}

export function StorymapModal() {
  const isOpen = useStorymapModalStore((s) => s.isOpen)
  const close = useStorymapModalStore((s) => s.close)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const handleClose = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank'
    }
    setIframeLoaded(false)
    close()
  }, [close])

  // Body scroll kilidi
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // ESC ile kapatma
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, handleClose])

  // Iframe'den gelen mesajlar (yeni sekmede aç isteği)
  useEffect(() => {
    if (!isOpen) return
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'storymap-open-new-tab' && typeof e.data?.url === 'string') {
        const url = resolveStorymapUrl(e.data.url)
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-0 md:p-4"
      style={{ zIndex: Z_INDEX }}
      role="dialog"
      aria-modal="true"
      aria-label="Hikâye Haritası"
    >
      {/* Overlay — tıklanınca kapat */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Kapat butonu — modal kutusunun dışında, overlay üzerinde sağ üst */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-[calc(0.5rem-1vh)] right-[3%] md:right-[10%] md:top-[calc(5vh-2%)] z-20 w-9 h-9 rounded-full flex items-center justify-center text-white hover:text-zinc-200 bg-black/50 hover:bg-black/70 transition-colors"
        aria-label="Kapat"
      >
        <i className="fa-solid fa-xmark text-lg" />
      </button>

      {/* Modal kutusu: desktop 90%/1200px/90vh/900px, mobil tam ekran köşeler keskin */}
      <div
        className="relative w-full h-full md:w-[90%] md:max-w-[1200px] md:h-[90vh] md:max-h-[900px] md:rounded-xl rounded-none bg-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Iframe alanı + loader */}
        <div className="relative flex-1 min-h-0 bg-zinc-100">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100" aria-hidden="true">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-zinc-300 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-sm text-zinc-500">Yükleniyor…</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={STORYMAP_URL}
            title="Hikâye Haritası"
            className="w-full h-full border-0"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
