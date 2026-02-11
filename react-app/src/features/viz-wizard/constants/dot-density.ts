/**
 * Dot Density — Ortak sabitler
 * UI (DotDensitySettings) ve renderer (PointRenderer) aynı varsayılanları kullanır.
 */

/** Varsayılan nokta yarıçapı (px) */
export const DEFAULT_DOT_SIZE = 2.4

/** Varsayılan nokta rengi */
export const DEFAULT_DOT_COLOR = '#2d6a4f'

/** Toplam hedef nokta sayısı — otomatik dotValue hesabında kullanılır */
export const TARGET_TOTAL_DOTS = 5_000

/** Performans koruması: haritadaki maksimum toplam nokta (sınırsız) */
export const MAX_TOTAL_DOTS = Infinity

/** Veri olan her feature için minimum nokta */
export const MIN_DOTS_PER_FEATURE = 1

/** Tek feature için maksimum nokta */
export const MAX_DOTS_PER_FEATURE = 2_000
