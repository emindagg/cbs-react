import { useEffect, useState } from 'react'

import type { VideoEntry } from './types'

const CATALOG_URL = `${import.meta.env.BASE_URL}video-modal/data/videos.json`

let cache: VideoEntry[] | null = null
let pending: Promise<VideoEntry[]> | null = null

async function loadCatalog(): Promise<VideoEntry[]> {
  if (cache) return cache
  if (pending) return pending
  pending = fetch(CATALOG_URL)
    .then((r) => r.json() as Promise<VideoEntry[]>)
    .then((data) => {
      cache = data
      pending = null
      return data
    })
    .catch((err) => {
      pending = null
      console.error('Video kataloğu yüklenemedi:', err)
      return []
    })
  return pending
}

/**
 * Tek video kataloğu kaynağı (video-modal/data/videos.json) için module-level cache'li hook.
 * Birden fazla yerden çağrılırsa tek bir fetch yapılır.
 */
export function useVideoCatalog(): VideoEntry[] {
  const [catalog, setCatalog] = useState<VideoEntry[]>(() => cache ?? [])

  useEffect(() => {
    if (cache) return
    let cancelled = false
    void loadCatalog().then((data) => {
      if (!cancelled) setCatalog(data)
    })
    return () => { cancelled = true }
  }, [])

  return catalog
}
