import type { ClassificationMethod } from '@/types/visualization'

interface DisambiguateBoundaryLabelsOptions {
  classificationMethod?: ClassificationMethod
}

type AbbreviationSuffix = 'k' | 'M' | 'B' | 'T'

const ABBREVIATION_THRESHOLD: Record<AbbreviationSuffix, number> = {
  k: 1e3,
  M: 1e6,
  B: 1e9,
  T: 1e12,
}

const MAX_PRECISION_WITH_SUFFIX = 6
const MAX_PRECISION_NO_SUFFIX = 8

function findDuplicateRuns(labels: string[]): Array<{ start: number; end: number }> {
  const runs: Array<{ start: number; end: number }> = []
  let i = 0

  while (i < labels.length) {
    let j = i + 1
    while (j < labels.length && labels[j] === labels[i]) {
      j++
    }

    if (j - i > 1) {
      runs.push({ start: i, end: j })
    }
    i = j
  }

  return runs
}

function areAllUnique(values: string[]): boolean {
  return new Set(values).size === values.length
}

function formatWithDigits(value: number, maxFractionDigits: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  })
}

function formatRawSafe(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 12,
  })
}

function detectAbbreviationSuffix(label: string): AbbreviationSuffix | null {
  const trimmed = label.trim()
  if (trimmed.endsWith('k')) return 'k'
  if (trimmed.endsWith('M')) return 'M'
  if (trimmed.endsWith('B')) return 'B'
  if (trimmed.endsWith('T')) return 'T'
  return null
}

function formatWithAbbreviation(
  value: number,
  suffix: AbbreviationSuffix,
  maxFractionDigits: number,
): string {
  const threshold = ABBREVIATION_THRESHOLD[suffix]
  const scaled = value / threshold
  return `${scaled.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  })}${suffix}`
}

function getInitialPrecision(method?: ClassificationMethod): number {
  if (method === 'kmeans' || method === 'jenks' || method === 'continuous-natural') {
    return 2
  }
  return 1
}

export function disambiguateBoundaryLabels(
  values: number[],
  formatLabel: (v: number) => string,
  options?: DisambiguateBoundaryLabelsOptions,
): string[] {
  const base = values.map(formatLabel)
  const duplicateRuns = findDuplicateRuns(base)
  if (duplicateRuns.length === 0) {
    return base
  }

  const result = [...base]
  const initialPrecision = getInitialPrecision(options?.classificationMethod)

  for (const run of duplicateRuns) {
    const runValues = values.slice(run.start, run.end)
    const suffix = detectAbbreviationSuffix(base[run.start] ?? '')
    let resolved = false

    if (suffix) {
      for (let digits = initialPrecision; digits <= MAX_PRECISION_WITH_SUFFIX; digits++) {
        const candidate = runValues.map((value) => formatWithAbbreviation(value, suffix, digits))
        if (areAllUnique(candidate)) {
          candidate.forEach((text, offset) => {
            result[run.start + offset] = text
          })
          resolved = true
          break
        }
      }
    }

    for (let digits = initialPrecision; digits <= MAX_PRECISION_NO_SUFFIX; digits++) {
      if (resolved) break
      const candidate = runValues.map((value) => formatWithDigits(value, digits))
      if (areAllUnique(candidate)) {
        candidate.forEach((text, offset) => {
          result[run.start + offset] = text
        })
        resolved = true
        break
      }
    }

    if (!resolved) {
      const fallback = runValues.map(formatRawSafe)
      fallback.forEach((text, offset) => {
        result[run.start + offset] = text
      })
    }
  }

  return result
}
