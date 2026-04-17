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
 * Veri dizisine normalizasyon uygular (tek sütun).
 * - none: ham veriyi döndürür
 * - percent-of-total: her değeri toplama böler (× 100)
 * - field: her değeri başka bir sütundaki değere böler
 *
 * Geçersiz satırlar (NaN değer, div===0, vs.) için ilgili sütunu `NaN` olarak
 * işaretler — downstream tüketiciler (sizeValues/colorValues/createDataMap) bu
 * satırları `isNaN` kontrolüyle düşürür. Bu davranış, normalize edilen ve
 * edilemeyen satırların aynı görselde karışık birimlerle sunulmasını önler.
 */
export function applyNormalization(
  data: Record<string, unknown>[],
  dataColumn: string,
  options: NormalizationOptions,
): Record<string, unknown>[] {
  return applyNormalizationMulti(data, [dataColumn], options)
}

/**
 * Birden fazla sütunu aynı normalizasyon yapılandırmasıyla tek geçişte normalize eder.
 *
 * Kritik özellik: `field` modunda bölen değeri ve `percent-of-total` modunda
 * toplamlar, HERHANGİ bir sütun değiştirilmeden önce girdi satırlarından
 * okunur. Böylece `divisionField`'ın normalize edilen sütunlardan biriyle
 * çakıştığı (örn. bivariate bubble'ın colorColumn = divisionField senaryosu)
 * durumlarda ikinci geçişin bozulmuş payda okuması önlenir.
 */
export function applyNormalizationMulti(
  data: Record<string, unknown>[],
  columns: string[],
  options: NormalizationOptions,
): Record<string, unknown>[] {
  const { type, divisionField } = options

  if (type === 'none' || !type || columns.length === 0) {
    return data
  }

  if (type === 'percent-of-total') {
    const totals: Record<string, number> = {}
    for (const col of columns) {
      totals[col] = data.reduce((sum, d) => {
        const v = parseFloat(String(d[col]))
        return sum + (isNaN(v) ? 0 : v)
      }, 0)
    }

    return data.map((d) => {
      const next: Record<string, unknown> = { ...d }
      for (const col of columns) {
        const total = totals[col]
        if (total === 0) {
          next[col] = NaN
          continue
        }
        const v = parseFloat(String(d[col]))
        next[col] = isNaN(v) ? NaN : (v / total) * 100
      }
      return next
    })
  }

  if (type === 'field' && divisionField) {
    return data.map((d) => {
      // Böleni, hiçbir sütunu değiştirmeden ÖNCE satırın orijinal
      // halinden oku — böylece divisionField kendisi normalize edilen
      // sütunlardan biri olsa bile doğru payda kullanılır.
      const div = parseFloat(String(d[divisionField]))
      const next: Record<string, unknown> = { ...d }
      const divInvalid = isNaN(div) || div === 0
      for (const col of columns) {
        const v = parseFloat(String(d[col]))
        next[col] = isNaN(v) || divInvalid ? NaN : v / div
      }
      return next
    })
  }

  return data
}
