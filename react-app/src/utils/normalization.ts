/**
 * Data Normalization Utilities
 * Veri normalizasyonu fonksiyonları — tüm renderer'lar tarafından kullanılabilir.
 */

import type { NormalizationType } from '../types/visualization'

interface NormalizationOptions {
  type: NormalizationType
  /** 'field' normalizasyonunda bölen sütun adı */
  divisionField?: string
}

/**
 * Veri dizisine normalizasyon uygular.
 * - none: ham veriyi döndürür
 * - percent-of-total: her değeri toplama böler (× 100)
 * - field: her değeri başka bir sütundaki değere böler
 */
export function applyNormalization(
  data: Record<string, unknown>[],
  dataColumn: string,
  options: NormalizationOptions,
): Record<string, unknown>[] {
  const { type, divisionField } = options

  if (type === 'none' || !type) {
    return data
  }

  if (type === 'percent-of-total') {
    const total = data.reduce((sum, d) => {
      const v = parseFloat(String(d[dataColumn]))
      return sum + (isNaN(v) ? 0 : v)
    }, 0)

    if (total === 0) return data

    return data.map((d) => {
      const v = parseFloat(String(d[dataColumn]))
      return {
        ...d,
        [dataColumn]: isNaN(v) ? d[dataColumn] : (v / total) * 100,
      }
    })
  }

  if (type === 'field' && divisionField) {
    return data.map((d) => {
      const v = parseFloat(String(d[dataColumn]))
      const div = parseFloat(String(d[divisionField]))
      if (isNaN(v) || isNaN(div) || div === 0) return d
      return {
        ...d,
        [dataColumn]: v / div,
      }
    })
  }

  return data
}
