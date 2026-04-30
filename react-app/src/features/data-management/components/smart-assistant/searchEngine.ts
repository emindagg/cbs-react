import { normalizeTurkishText } from '@/utils/turkishNormalizer'

import type { VideoEntry } from './types'

const TITLE_HIT_SCORE = 3
const KEYWORD_HIT_SCORE = 1
const FUZZY_TITLE_SCORE = 2
const FUZZY_KEYWORD_SCORE = 0.5
const MIN_TOKEN_LEN = 2
const FUZZY_MIN_TOKEN_LEN = 4
const FUZZY_MAX_DISTANCE = 1
const MAX_RESULTS = 5

interface PreparedEntry {
  entry: VideoEntry
  titleNorm: string
  haystackNorm: string
  haystackTokens: string[]
}

/** Normalize edilmiş alanları her aramada yeniden hesaplamamak için memoization */
const prepareCache = new WeakMap<VideoEntry[], PreparedEntry[]>()

function prepare(catalog: VideoEntry[]): PreparedEntry[] {
  const cached = prepareCache.get(catalog)
  if (cached) return cached
  const prepared = catalog.map((entry) => {
    const titleNorm = normalizeTurkishText(entry.title, true)
    const haystackNorm = normalizeTurkishText(
      `${entry.title} ${entry.hint} ${entry.keywords}`,
      true,
    )
    return {
      entry,
      titleNorm,
      haystackNorm,
      haystackTokens: haystackNorm.split(/\s+/).filter(Boolean),
    }
  })
  prepareCache.set(catalog, prepared)
  return prepared
}

/** Klasik iteratif Levenshtein — tek allocation, küçük token'lar için yeterli */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array(b.length + 1)
  const curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

/**
 * Fuzzy match: token herhangi bir haystack token'ına Levenshtein ≤ 1 ise true.
 * Sadece token uzunluğu ≥ FUZZY_MIN_TOKEN_LEN olduğunda devreye girer (kısa tokenlarda
 * yanlış pozitif çok olur).
 */
function fuzzyMatch(token: string, haystackTokens: string[]): boolean {
  if (token.length < FUZZY_MIN_TOKEN_LEN) return false
  for (const ht of haystackTokens) {
    // Aşırı uzunluk farkı varsa atla
    if (Math.abs(ht.length - token.length) > FUZZY_MAX_DISTANCE) continue
    if (levenshtein(token, ht) <= FUZZY_MAX_DISTANCE) return true
  }
  return false
}

export interface SearchResult {
  entry: VideoEntry
  score: number
  matchedTokens: string[]
}

/**
 * Türkçe-aware token bazlı skorlama + son token için fuzzy fallback.
 * Boş sorgu → boş sonuç (varsayılan öneriler ayrı bir yerden gelir).
 */
export function searchVideos(query: string, catalog: VideoEntry[]): SearchResult[] {
  const normalizedQuery = normalizeTurkishText(query, true)
  if (!normalizedQuery) return []

  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => normalizeTurkishText(t, true))
    .filter((t) => t.length >= MIN_TOKEN_LEN)

  const queryTokens = tokens.length > 0 ? tokens : [normalizedQuery]
  const prepared = prepare(catalog)

  const scored = prepared.map((p) => {
    let score = 0
    const matched: string[] = []
    for (const t of queryTokens) {
      if (p.haystackNorm.includes(t)) {
        const inTitle = p.titleNorm.includes(t)
        score += inTitle ? TITLE_HIT_SCORE : KEYWORD_HIT_SCORE
        matched.push(t)
      } else if (fuzzyMatch(t, p.haystackTokens)) {
        // Substring tutmadıysa fuzzy fallback — daha düşük puan
        const inTitleFuzzy = fuzzyMatch(t, p.titleNorm.split(/\s+/).filter(Boolean))
        score += inTitleFuzzy ? FUZZY_TITLE_SCORE : FUZZY_KEYWORD_SCORE
        matched.push(t)
      }
    }
    return { entry: p.entry, score, matchedTokens: matched }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.num - b.entry.num)
    .slice(0, MAX_RESULTS)
}
