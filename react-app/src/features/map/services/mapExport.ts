import { snapdom } from '@zumer/snapdom'
import type { Map as MaplibreMap } from 'maplibre-gl'

/**
 * Harita + tüm görsel overlay'leri (başlık, lejant, kuzey oku, ölçek, koordinat) yakalayıp
 * PNG veya PDF olarak indiren export servisi.
 *
 * Teknik yaklaşım:
 * 1. MapLibre canvas'ı WebGL → `preserveDrawingBuffer: true` zorunlu (MapContainer'da ayarlı).
 * 2. Yakalama anında `map.triggerRepaint()` + `idle` bekle → canvas boş çıkmaz.
 * 3. SnapDOM root DOM'u yakalar (canvas dahil); DOM overlay'ler otomatik girer.
 * 4. `data-export-ignore="true"` olan elementler çıktıda görünmez (ör: Sidebar, kontrol
 *    barları, GIS araç menüsü, bölge seçici).
 * 5. `region` verildiğinde yakalanan canvas istenen alana kırpılır.
 */

const ROOT_ID = 'app-root'

// Export'a dahil edilmeyecek UI kontrolleri (DRY — tek kaynak).
const EXCLUDE_SELECTORS = [
  '[data-export-ignore="true"]',
  '#sidebar',
  '#map-control-container',
  '.maplibregl-ctrl-attrib',
]

export type ExportQuality = 'standard' | 'high' | 'print'

const QUALITY_SCALE: Record<ExportQuality, number> = {
  standard: 1.5,
  high: 2.5,
  print: 3.5,
}

export interface ExportRegion {
  x: number
  y: number
  w: number
  h: number
}

export interface ExportOptions {
  quality?: ExportQuality
  filenameBase?: string
  /** #app-root koordinat sistemine göre kırpma alanı. Verilmezse tüm ekran alınır. */
  region?: ExportRegion | null
}

interface CaptureOptions extends ExportOptions {
  map?: MaplibreMap | null
}

function getRootElement(): HTMLElement {
  const el = document.getElementById(ROOT_ID)
  if (!el) {
    throw new Error(`Capture kökü bulunamadı (#${ROOT_ID})`)
  }
  return el
}

/**
 * MapLibre canvas'ının dolu ve doğru boyutta olmasını garantiler.
 * - `resize()`: canvas backing buffer'ı container boyutuna hizalar (snapdom'un CSS ölçümüyle
 *    MapLibre WebGL buffer arasındaki uyumsuzluk → sağ/alt kesilmeyi önler).
 * - `triggerRepaint()` + `idle`: tüm tile'lar ve katmanlar çizildikten sonra yakala.
 */
async function waitForMapIdle(map: MaplibreMap): Promise<void> {
  try { map.resize() } catch { /* no-op */ }
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }
    map.once('idle', done)
    map.triggerRepaint()
    const SAFETY_TIMEOUT_MS = 2000
    setTimeout(done, SAFETY_TIMEOUT_MS)
  })
}

function cropCanvas(
  source: HTMLCanvasElement,
  region: ExportRegion,
  scale: number,
): HTMLCanvasElement {
  const sx = Math.max(0, Math.round(region.x * scale))
  const sy = Math.max(0, Math.round(region.y * scale))
  const sw = Math.min(source.width - sx, Math.round(region.w * scale))
  const sh = Math.min(source.height - sy, Math.round(region.h * scale))

  const out = document.createElement('canvas')
  out.width = sw
  out.height = sh
  const ctx = out.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context alınamadı')
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)
  return out
}

async function captureCanvas(options: CaptureOptions): Promise<HTMLCanvasElement> {
  const { quality = 'high', map, region } = options
  const root = getRootElement()

  if (map) {
    await waitForMapIdle(map)
  }

  const scale = QUALITY_SCALE[quality]
  const rect = root.getBoundingClientRect()
  // Viewport'un tamamını kapsa: #app-root bazı stillerle daha dar ölçülebiliyor
  // (snapdom issue #37). En emin değer window.innerWidth/Height.
  const cssW = Math.max(rect.width, window.innerWidth)
  const cssH = Math.max(rect.height, window.innerHeight)
  const targetW = Math.round(cssW * scale)
  const targetH = Math.round(cssH * scale)

  // `scale` vermiyoruz — aksi halde `width/height` yok sayılıyor (tipe bakın).
  // `dpr: 1` → Windows %125 display scaling gibi durumlarda çift ölçeklenmeyi engeller.
  const capture = await snapdom(root, {
    width: targetW,
    height: targetH,
    dpr: 1,
    fast: false,
    embedFonts: true,
    exclude: EXCLUDE_SELECTORS,
    excludeMode: 'remove',
    backgroundColor: '#ffffff',
    cache: 'auto',
  })

  const canvas = await capture.toCanvas()
  return region ? cropCanvas(canvas, region, scale) : canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, mime = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas blob üretilemedi'))
      },
      mime,
    )
  })
}

function buildFilename(base: string, ext: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')
  return `${base}-${stamp}.${ext}`
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function exportAsPng(options: CaptureOptions = {}): Promise<void> {
  const { filenameBase = 'harita' } = options
  const canvas = await captureCanvas(options)
  const blob = await canvasToBlob(canvas, 'image/png')
  downloadBlob(blob, buildFilename(filenameBase, 'png'))
}

/**
 * Yakalanan görüntüyü A4 PDF'e sığacak şekilde gömer. Orientation görsel oranına göre
 * otomatik seçilir (yatay görüntü → landscape).
 */
export async function exportAsPdf(options: CaptureOptions = {}): Promise<void> {
  const { filenameBase = 'harita' } = options
  const canvas = await captureCanvas(options)

  const imgW = canvas.width
  const imgH = canvas.height
  const dataUrl = canvas.toDataURL('image/png')

  const { jsPDF } = await import('jspdf')

  const A4_LONG_MM = 297
  const A4_SHORT_MM = 210
  const MARGIN_MM = 8

  const isLandscape = imgW >= imgH
  const pageW = isLandscape ? A4_LONG_MM : A4_SHORT_MM
  const pageH = isLandscape ? A4_SHORT_MM : A4_LONG_MM

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const availW = pageW - MARGIN_MM * 2
  const availH = pageH - MARGIN_MM * 2
  const scale = Math.min(availW / imgW, availH / imgH)
  const drawW = imgW * scale
  const drawH = imgH * scale
  const offsetX = (pageW - drawW) / 2
  const offsetY = (pageH - drawH) / 2

  pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, drawW, drawH, undefined, 'FAST')
  pdf.save(buildFilename(filenameBase, 'pdf'))
}
