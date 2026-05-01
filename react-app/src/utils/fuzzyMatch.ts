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
  /** Display label (e.g. "Adana" or "Adana > Şehitkamil") */
  originalValue: string
  rowIndices: number[]
  suggestion: FuzzyMatch | null
  /** Column whose value should be replaced when applying the correction */
  targetColumn: string
  /** Raw cell value that should be overwritten by suggestion.value */
  replaceValue: string
}

interface GroupOptions {
  districtColumn?: string | null
  locationLevel?: 'province' | 'mixed'
}

export function groupUnmatchedValues(
  rows: Record<string, unknown>[],
  locationColumn: string,
  unmatchedIndices: Set<number>,
  geoJsonKeys: string[],
  normalizer: (s: string) => string,
  options: GroupOptions = {},
): UnmatchedGroup[] {
  const { districtColumn, locationLevel = 'province' } = options

  if (locationLevel === 'mixed' && districtColumn) {
    return groupMixed(rows, locationColumn, districtColumn, unmatchedIndices, geoJsonKeys, normalizer)
  }

  return groupProvince(rows, locationColumn, unmatchedIndices, geoJsonKeys)
}

function groupProvince(
  rows: Record<string, unknown>[],
  column: string,
  unmatchedIndices: Set<number>,
  geoJsonKeys: string[],
): UnmatchedGroup[] {
  const groups = new Map<string, number[]>()

  rows.forEach((row, idx) => {
    if (!unmatchedIndices.has(idx)) return
    const raw = String(row[column] ?? '').trim()
    if (!raw) return
    const existing = groups.get(raw) ?? []
    existing.push(idx)
    groups.set(raw, existing)
  })

  const geoKeysList = Array.from(geoJsonKeys)

  return Array.from(groups.entries()).map(([val, indices]) => ({
    originalValue: val,
    rowIndices: indices,
    suggestion: findBestMatch(val, geoKeysList),
    targetColumn: column,
    replaceValue: val,
  }))
}

function groupMixed(
  rows: Record<string, unknown>[],
  provinceColumn: string,
  districtColumn: string,
  unmatchedIndices: Set<number>,
  geoJsonKeys: string[],
  normalizer: (s: string) => string,
): UnmatchedGroup[] {
  // Build province set + per-province district lookup from combined keys.
  // Combined keys look like "adana_aladag" (already normalized).
  const provinceSet = new Set<string>()
  const districtsByProvince = new Map<string, Set<string>>()
  for (const key of geoJsonKeys) {
    const idx = key.indexOf('_')
    if (idx < 0) continue
    const prov = key.substring(0, idx)
    const dist = key.substring(idx + 1)
    if (!/^[a-z]+$/.test(prov)) continue // skip plate-code variants ("01_aladag")
    provinceSet.add(prov)
    let set = districtsByProvince.get(prov)
    if (!set) {
      set = new Set<string>()
      districtsByProvince.set(prov, set)
    }
    set.add(dist)
  }

  const provinceList = Array.from(provinceSet)

  // province-level groups: rows whose province itself is unrecognized
  const provinceGroups = new Map<string, number[]>()
  // district-level groups keyed by `${rawProvince}|||${rawDistrict}`
  interface DistrictBucket {
    rawProvince: string
    rawDistrict: string
    normProvince: string
    indices: number[]
  }
  const districtGroups = new Map<string, DistrictBucket>()

  rows.forEach((row, idx) => {
    if (!unmatchedIndices.has(idx)) return
    const rawProvince = String(row[provinceColumn] ?? '').trim()
    const rawDistrict = String(row[districtColumn] ?? '').trim()
    if (!rawProvince) return
    const normProvince = normalizer(rawProvince)

    if (!provinceSet.has(normProvince)) {
      const arr = provinceGroups.get(rawProvince) ?? []
      arr.push(idx)
      provinceGroups.set(rawProvince, arr)
      return
    }

    if (!rawDistrict) return
    const key = `${rawProvince}|||${rawDistrict}`
    const bucket = districtGroups.get(key)
    if (bucket) {
      bucket.indices.push(idx)
    } else {
      districtGroups.set(key, {
        rawProvince,
        rawDistrict,
        normProvince,
        indices: [idx],
      })
    }
  })

  const result: UnmatchedGroup[] = []

  for (const [val, indices] of provinceGroups) {
    result.push({
      originalValue: val,
      rowIndices: indices,
      suggestion: findBestMatch(val, provinceList),
      targetColumn: provinceColumn,
      replaceValue: val,
    })
  }

  for (const bucket of districtGroups.values()) {
    const candidates = Array.from(districtsByProvince.get(bucket.normProvince) ?? [])
    result.push({
      originalValue: `${bucket.rawProvince} > ${bucket.rawDistrict}`,
      rowIndices: bucket.indices,
      suggestion: findBestMatch(bucket.rawDistrict, candidates),
      targetColumn: districtColumn,
      replaceValue: bucket.rawDistrict,
    })
  }

  return result
}
