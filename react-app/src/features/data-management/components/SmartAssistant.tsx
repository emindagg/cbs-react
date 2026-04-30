import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { useVideoModalStore } from '@/stores/useVideoModalStore'
import { normalizeTurkishText } from '@/utils/turkishNormalizer'

interface Suggestion {
  id: string
  num: number
  title: string
  hint: string
  /** Eş anlamlı / alternatif arama anahtarları — boşlukla ayrılır */
  keywords: string
}

/** Tüm 15 eğitim videosu — Türkçe eş anlamlılar dahil */
const VIDEO_CATALOG: Suggestion[] = [
  { id: '1',  num: 1,  title: 'Arayüz Tanıtımı',                 hint: 'OGM Materyal CBS platformuna giriş',           keywords: 'arayuz tanitim giris baslangic platform interface ogm materyal' },
  { id: '2',  num: 2,  title: 'Veri Görselleştirme',             hint: 'Harita üretme ve renk şeması',                 keywords: 'gorsellestirme gorsel harita renk sema kategori siniflandirma stil' },
  { id: '3',  num: 3,  title: 'Harita Etiketleme Seçenekleri',   hint: 'Etiket ve sınıflandırma seçenekleri',          keywords: 'etiket etiketleme label siniflandirma kategori metin' },
  { id: '4',  num: 4,  title: 'Astronomi Modülü',                hint: 'Güneş, ay, gece-gündüz analizi',               keywords: 'astronomi gunes ay gece gunduz dogus batis golge' },
  { id: '5',  num: 5,  title: 'Veri Oluşturma',                  hint: 'Veri yükleme, içe aktarma ve yönetimi',        keywords: 'veri data yukleme yukle import ice aktarma olusturma csv excel xlsx geojson kml shp shapefile zip url' },
  { id: '6',  num: 6,  title: 'Zaman Çizelgesi',                 hint: 'Zaman temelli analiz ve animasyon',            keywords: 'zaman cizelge cizelgesi timeline tarih animasyon temporal' },
  { id: '7',  num: 7,  title: 'Ölçüm Araçları',                  hint: 'Mesafe ve alan ölçümü',                        keywords: 'olcum olcme olcer mesafe uzaklik alan area distance metre kilometre kilometer cevre perimeter' },
  { id: '8',  num: 8,  title: 'Mekânsal Analiz Araçları — 1',    hint: 'Etki alanı (tampon/buffer) analizi',           keywords: 'mekansal analiz tampon buffer etki alani spatial' },
  { id: '9',  num: 9,  title: 'Mekânsal Analiz Araçları — 2',    hint: 'Kümeleme, dış sınır, en yakın, ısı haritası',  keywords: 'mekansal analiz kumeleme cluster clustering convex hull dis sinir en yakin nearest isi heatmap' },
  { id: '10', num: 10, title: 'Altlık Harita ve Katmanlar',      hint: 'Basemap ve katman yönetimi',                   keywords: 'altlik basemap harita katman katmanlar layer layers uydu' },
  { id: '11', num: 11, title: 'Proje Yönetimi',                  hint: 'Proje oluşturma, kaydetme ve geri yükleme',    keywords: 'proje project kaydet kaydetme save yukleme yukle load yonetim aciliz indir' },
  { id: '12', num: 12, title: 'Hikâye Haritası — Giriş',         hint: 'Storymap modülüne giriş',                      keywords: 'hikaye hikayesi storymap story giris baslangic' },
  { id: '13', num: 13, title: 'Hikâye Haritası — Arayüz',        hint: 'Arayüz ve çizim araçları',                     keywords: 'hikaye storymap arayuz cizim cizgi nokta poligon' },
  { id: '14', num: 14, title: 'Hikâye Haritası Oluşturma — 1',   hint: 'Varsayılan ve hikâye şablonları',              keywords: 'hikaye storymap olusturma sablon template varsayilan default' },
  { id: '15', num: 15, title: 'Hikâye Haritası Oluşturma — 2',   hint: 'Rota ve zaman çizelgesi şablonları, paylaşım', keywords: 'hikaye storymap rota route zaman cizelge timeline sablon paylas paylasim share' },
]

/** Boş sorguda öne çıkan 3 öneri */
const DEFAULT_HIGHLIGHT_IDS = ['1', '2', '3']

/** Tarayıcı sesli komutu desteklemediğinde butonun yanıp söneceği süre (ms) */
const VOICE_FALLBACK_FLASH_MS = 600

/** Türkçe-aware token bazlı skorlama */
function searchVideos(query: string, catalog: Suggestion[]): Suggestion[] {
  const normalizedQuery = normalizeTurkishText(query, true)
  if (!normalizedQuery) {
    return DEFAULT_HIGHLIGHT_IDS
      .map((id) => catalog.find((v) => v.id === id))
      .filter((v): v is Suggestion => Boolean(v))
  }

  // Sorguyu tek tek harf gruplarına böl — kullanıcı "ölçüm araç" yazarsa
  // orijinal sözcük sınırlarını ayrıştırmak için raw query'yi de tokenize ediyoruz
  const rawTokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => normalizeTurkishText(t, true))
    .filter((t) => t.length >= 2)

  const tokens = rawTokens.length > 0 ? rawTokens : [normalizedQuery]

  type Scored = { item: Suggestion; score: number }
  const scored: Scored[] = catalog.map((item) => {
    const haystack = normalizeTurkishText(
      `${item.title} ${item.hint} ${item.keywords}`,
      true,
    )
    let score = 0
    for (const t of tokens) {
      if (haystack.includes(t)) {
        // Başlıkta geçenler daha yüksek puanlanır
        const inTitle = normalizeTurkishText(item.title, true).includes(t)
        score += inTitle ? 3 : 1
      }
    }
    return { item, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.item.num - b.item.num)
    .slice(0, 5)
    .map((s) => s.item)
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  start: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function SmartAssistant() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverId = useId()

  const filtered = useMemo(() => searchVideos(query, VIDEO_CATALOG), [query])

  // Dış tıklama ile kapat
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // ESC ile kapat
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Açılınca arama input'una odaklan
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  const openLibrary = () => {
    setOpen(false)
    useVideoModalStore.getState().open()
  }

  const playSuggestion = (s: Suggestion) => {
    setOpen(false)
    // video-modal/scripts/rehberlik.js içinde her video id'si "cbs-{num}" formatında
    useVideoModalStore.getState().open(`cbs-${s.num}`)
  }

  const handleVoice = () => {
    const SR = getSpeechRecognition()
    if (!SR) {
      // Tarayıcı desteklemiyor — kullanıcıya görsel feedback için kısa flash
      setVoiceActive(true)
      setTimeout(() => setVoiceActive(false), VOICE_FALLBACK_FLASH_MS)
      return
    }
    const r = new SR()
    r.lang = 'tr-TR'
    r.interimResults = false
    r.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      setQuery(transcript)
      setVoiceActive(false)
    }
    setVoiceActive(true)
    r.start()
  }

  return (
    <div ref={containerRef} className="relative mt-3">
      {/* === Akıllı Yardım Kapsülü === */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white/40 px-4 py-2 backdrop-blur-md ring-1 ring-inset ring-zinc-900/10 transition-[background-color,box-shadow,transform] duration-300 hover:bg-white/70 hover:ring-emerald-400/40 hover:shadow-[0_8px_24px_-6px_rgba(16,185,129,0.35)] active:scale-[0.98] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        title="Nasıl Kullanılır?"
      >
        {/* Ortam ışığı yansıması — radial gradient */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_40%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.14),transparent_55%)] opacity-70 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* Sparkle ikon — hover'da yumuşak dönüş */}
        <svg
          viewBox="0 0 24 24"
          className="relative h-4 w-4 shrink-0 transition-transform duration-[900ms] ease-out group-hover:rotate-[180deg]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`sa-spark-${popoverId}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {/* Ana 4-uçlu yıldız + iki uydu sparkle */}
          <path
            d="M12 2.5L13.4 9.1L20 10.5L13.4 11.9L12 18.5L10.6 11.9L4 10.5L10.6 9.1Z"
            fill={`url(#sa-spark-${popoverId})`}
          />
          <path
            d="M19.2 3.4L19.6 5.2L21.4 5.6L19.6 6L19.2 7.8L18.8 6L17 5.6L18.8 5.2Z"
            fill={`url(#sa-spark-${popoverId})`}
            opacity="0.85"
          />
          <path
            d="M5.2 15.5L5.5 16.8L6.8 17.1L5.5 17.4L5.2 18.7L4.9 17.4L3.6 17.1L4.9 16.8Z"
            fill={`url(#sa-spark-${popoverId})`}
            opacity="0.7"
          />
        </svg>

        <span className="relative text-[12px] font-medium tracking-wide text-zinc-800">
          Nasıl Kullanılır?
        </span>

        {/* Aşağı ok — açıklığı belli etsin */}
        <svg
          viewBox="0 0 12 12"
          className={`relative h-2.5 w-2.5 shrink-0 fill-zinc-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4z" />
        </svg>
      </button>

      {/* === Bağlamsal Öneri Paneli (glassmorphism) === */}
      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Nasıl Kullanılır? — Eğitim Videoları"
          className="absolute bottom-full left-0 right-0 z-30 mb-2 rounded-2xl border border-white/60 bg-white/75 p-2.5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25),0_0_0_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-1 duration-200"
        >
          {/* Hafif iç parıltı */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_55%)]"
          />

          {/* === NLP Arama + Sesli Komut === */}
          <div className="relative flex items-center gap-2 rounded-xl border border-zinc-200/70 bg-white/90 px-2.5 py-1.5 shadow-xs">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <path
                d="M12 2.5L13.4 9.1L20 10.5L13.4 11.9L12 18.5L10.6 11.9L4 10.5L10.6 9.1Z"
                fill="url(#sa-search-grad)"
              />
              <defs>
                <linearGradient id="sa-search-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ne yapmak istersiniz?"
              className="flex-1 bg-transparent text-[12px] text-zinc-900 placeholder-zinc-400 outline-hidden"
              aria-label="Doğal dil ile arama"
            />
            <button
              type="button"
              onClick={handleVoice}
              className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                voiceActive
                  ? 'bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.25)]'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-emerald-600'
              }`}
              title="Sesle ara"
              aria-label="Sesle ara"
            >
              {voiceActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40"
                />
              )}
              <i className="fa-solid fa-microphone relative text-[10px]" aria-hidden />
            </button>
          </div>

          {/* === Bağlamsal Öneriler === */}
          <ul className="relative mt-2 space-y-0.5">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-center">
                <span className="block text-[11px] text-zinc-600">
                  &quot;{query}&quot; için sonuç yok.
                </span>
                <button
                  type="button"
                  onClick={openLibrary}
                  className="mt-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Tüm rehbere göz at →
                </button>
              </li>
            ) : (
              filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => playSuggestion(s)}
                    className="group/item flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-emerald-50/80"
                    title={`"${s.title}" videosunu oynat`}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-300/40 tabular-nums">
                      {s.num}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-[12px] font-medium text-zinc-900">
                        {s.title}
                      </span>
                      <span className="block truncate text-[10px] text-zinc-500">
                        {s.hint}
                      </span>
                    </span>
                    <i
                      className="fa-solid fa-arrow-right text-[10px] text-zinc-300 transition-all group-hover/item:translate-x-0.5 group-hover/item:text-emerald-600"
                      aria-hidden
                    />
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* === Footer: Tüm rehber CTA === */}
          <div className="relative mt-2 flex items-center justify-end border-t border-zinc-200/70 pt-2">
            <button
              type="button"
              onClick={openLibrary}
              className="group/cta inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
            >
              <span>Tüm rehberi aç</span>
              <i className="fa-solid fa-arrow-right text-[9px] transition-transform group-hover/cta:translate-x-0.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
