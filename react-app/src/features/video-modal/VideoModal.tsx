import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useVideoModalStore } from '@/stores/useVideoModalStore'

const VIDEO_MODAL_URL = `${import.meta.env.BASE_URL}video-modal/index.html`
const Z_INDEX = 20000

export function VideoModal() {
  const isOpen = useVideoModalStore((s) => s.isOpen)
  const close = useVideoModalStore((s) => s.close)
  const targetVideoId = useVideoModalStore((s) => s.targetVideoId)
  const clearTarget = useVideoModalStore((s) => s.clearTarget)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const handleClose = useCallback(() => {
    // about:blank'a set ederek iframe içindeki tüm Plyr instance'larını sonlandır
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank'
    }
    setIframeLoaded(false)
    close()
  }, [close])

  // İframe içinden VIDEO_MODAL_READY mesajı gelince hedef videoyu oynat
  useEffect(() => {
    if (!isOpen) return
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string } | null
      if (!data || typeof data !== 'object') return
      if (data.type !== 'VIDEO_MODAL_READY') return
      if (!targetVideoId) return
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'PLAY_VIDEO', videoId: targetVideoId },
        '*',
      )
      clearTarget()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isOpen, targetVideoId, clearTarget])

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

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-0 md:p-4"
      style={{ zIndex: Z_INDEX }}
      role="dialog"
      aria-modal="true"
      aria-label="Eğitim Videoları"
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

      {/* Modal kutusu */}
      <div
        className="relative w-full h-full md:w-[90%] md:max-w-[1200px] md:h-[90vh] md:max-h-[900px] md:rounded-xl rounded-none bg-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
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
            src={VIDEO_MODAL_URL}
            title="Eğitim Videoları"
            className="w-full h-full border-0"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
