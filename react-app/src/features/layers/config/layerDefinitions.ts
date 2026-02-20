export type OverlayLayerType = 'line' | 'fill' | 'circle'

export interface OverlayLayerDefinition {
  id: string
  name: string
  file: string
  type: OverlayLayerType
  color: string
  opacity: number
}

export const OVERLAY_LAYER_DEFINITIONS: OverlayLayerDefinition[] = [
  {
    id: 'akarsular',
    name: 'Akarsular',
    file: 'akarsular.zip',
    type: 'line',
    color: '#0066cc',
    opacity: 0.9,
  },
  {
    id: 'sular',
    name: 'Su Yüzeyi',
    file: 'sular.zip',
    type: 'fill',
    color: '#4da6ff',
    opacity: 0.6,
  },
  {
    id: 'ulasim',
    name: 'Ulaşım',
    file: 'ulasim.zip',
    type: 'line',
    color: '#ff6600',
    opacity: 0.8,
  },
  {
    id: 'dfy',
    name: 'Türkiye Diri Fay Haritası',
    file: 'diri_fay.zip',
    type: 'fill',
    color: '#33cc33',
    opacity: 0.6,
  },
]

export const OVERLAY_LAYER_BASE_URL = 'https://cdn.jsdelivr.net/gh/emindagg/katman_verisi/'
