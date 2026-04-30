import { useMemo } from 'react'

import { useDataManagementStore } from '@/stores/useDataManagementStore'
import { useStorymapModalStore } from '@/stores/useStorymapModalStore'
import { useToolStore } from '@/stores/useToolStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

import type { VideoEntry } from './types'

/**
 * Kullanıcının uygulamada nerede olduğuna bağlı öncelikli video numaraları.
 * Sıralama kullanıcıya gösterilen sıradır. Sayılar videos.json'daki num alanına karşılık gelir.
 */
/* eslint-disable no-magic-numbers */
function pickDefaultNums(opts: {
  itemCount: number
  vizStep: number
  activeTool: string
  storymapOpen: boolean
}): number[] {
  if (opts.storymapOpen) return [12, 13, 14]
  if (opts.activeTool === 'measure-distance' || opts.activeTool === 'measure-area') {
    return [7, 5, 2]
  }
  if (opts.activeTool === 'analysis') return [8, 9, 7]
  if (opts.activeTool === 'aspect-analysis') return [4, 9, 2]
  if (opts.activeTool === 'timeline') return [6, 2, 11]
  if (opts.vizStep > 1) return [2, 3, 6]
  if (opts.itemCount === 0) return [5, 1, 2]
  return [1, 2, 3]
}
/* eslint-enable no-magic-numbers */

/**
 * Mevcut bağlama göre 3 varsayılan video önerisi döndürür.
 * Kataloğun yüklenmemiş olduğu durumda boş dizi döner.
 */
export function useContextualDefaults(catalog: VideoEntry[]): VideoEntry[] {
  const itemCount = useDataManagementStore((s) => s.items.length)
  const vizStep = useVisualizationStore((s) => s.currentStep)
  const activeTool = useToolStore((s) => s.activeTool)
  const storymapOpen = useStorymapModalStore((s) => s.isOpen)

  return useMemo(() => {
    if (catalog.length === 0) return []
    const nums = pickDefaultNums({ itemCount, vizStep, activeTool, storymapOpen })
    return nums
      .map((n) => catalog.find((v) => v.num === n))
      .filter((v): v is VideoEntry => Boolean(v))
  }, [catalog, itemCount, vizStep, activeTool, storymapOpen])
}
