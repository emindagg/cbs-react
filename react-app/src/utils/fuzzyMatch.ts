function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)

  for (let i = 1; i <= m; i++) {
    let prev = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const curr = Math.min(
        dp[j] + 1,
        prev + 1,
        dp[j - 1] + cost,
      )
      dp[j - 1] = prev
      prev = curr
    }
    dp[n] = prev
  }

  return dp[n]
}

export interface FuzzyMatch {
  value: string
  distance: number
  similarity: number
}

export function findBestMatch(input: string, candidates: string[], maxDistance = 3): FuzzyMatch | null {
  const normalized = input.toLowerCase().trim()
  if (!normalized) return null

  let best: FuzzyMatch | null = null

  for (const candidate of candidates) {
    const normCandidate = candidate.toLowerCase().trim()
    const dist = levenshtein(normalized, normCandidate)

    if (dist > maxDistance) continue
    const maxLen = Math.max(normalized.length, normCandidate.length)
    const similarity = maxLen > 0 ? 1 - dist / maxLen : 0

    if (!best || dist < best.distance) {
      best = { value: candidate, distance: dist, similarity }
    }
  }

  return best
}

export interface UnmatchedGroup {
  originalValue: string
  rowIndices: number[]
  suggestion: FuzzyMatch | null
}

export function groupUnmatchedValues(
  rows: Record<string, unknown>[],
  column: string,
  geoJsonKeys: string[],
  matchedSet: Set<string>,
  normalizer: (s: string) => string,
): UnmatchedGroup[] {
  const groups = new Map<string, number[]>()

  rows.forEach((row, idx) => {
    const raw = String(row[column] ?? '')
    const normalized = normalizer(raw)
    if (matchedSet.has(normalized)) return

    const key = raw.trim()
    if (!key) return
    const existing = groups.get(key) ?? []
    existing.push(idx)
    groups.set(key, existing)
  })

  const geoKeysList = Array.from(geoJsonKeys)

  return Array.from(groups.entries()).map(([val, indices]) => ({
    originalValue: val,
    rowIndices: indices,
    suggestion: findBestMatch(val, geoKeysList),
  }))
}
