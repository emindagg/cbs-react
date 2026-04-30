import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onerror: (e: { error?: string }) => void
  onend: () => void
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type VoiceState = 'idle' | 'listening' | 'unsupported' | 'denied' | 'error'

interface UseVoiceSearchOpts {
  onTranscript: (text: string) => void
  lang?: string
}

/**
 * Tarayıcı SpeechRecognition wrapper'ı:
 *  - tek instance, tekrar tıklamada eski oturumu abort eder
 *  - error/denied durumlarını state olarak yansıtır
 *  - kısa görsel feedback için unsupported durumda da listening yanıp söner
 */
export function useVoiceSearch({ onTranscript, lang = 'tr-TR' }: UseVoiceSearchOpts) {
  const [state, setState] = useState<VoiceState>('idle')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const isSupported = !!getSpeechRecognition()

  const start = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      setState('unsupported')
      return
    }
    // Önceki oturum varsa kapat
    recognitionRef.current?.abort()

    const r = new SR()
    r.lang = lang
    r.interimResults = false
    r.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) onTranscriptRef.current(transcript)
    }
    r.onerror = (e) => {
      setState(e.error === 'not-allowed' ? 'denied' : 'error')
    }
    r.onend = () => {
      setState((prev) => (prev === 'listening' ? 'idle' : prev))
    }
    recognitionRef.current = r
    setState('listening')
    try {
      r.start()
    } catch {
      setState('error')
    }
  }, [lang])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  // Unmount'ta cleanup
  useEffect(() => () => { recognitionRef.current?.abort() }, [])

  return { state, isSupported, start, stop }
}
