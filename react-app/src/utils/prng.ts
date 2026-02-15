/**
 * Seeded PRNG — Tekrarlanabilir nokta yerleşimi için
 *
 * mulberry32: 32-bit seeded pseudo-random number generator
 * hashString: djb2 string hash (feature adından seed üretir)
 */

// djb2 hash algorithm constants
const DJB2_INIT = 5381
const DJB2_SHIFT = 5

// mulberry32 PRNG constants
const MULBERRY32_INCREMENT = 0x6d2b79f5
const MULBERRY32_SHIFT_1 = 15
const MULBERRY32_SHIFT_2 = 7
const MULBERRY32_SHIFT_3 = 14
const MULBERRY32_MIX_1 = 61
const MULBERRY32_DIVISOR = 4294967296

/** djb2 string hash → 32-bit unsigned integer */
export function hashString(str: string): number {
  let hash = DJB2_INIT
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << DJB2_SHIFT) + hash + str.charCodeAt(i)) >>> 0
  }
  return hash
}

/** mulberry32 — Returns a function that yields [0,1) on each call */
export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + MULBERRY32_INCREMENT) | 0
    let t = Math.imul(s ^ (s >>> MULBERRY32_SHIFT_1), 1 | s)
    t = (t + Math.imul(t ^ (t >>> MULBERRY32_SHIFT_2), MULBERRY32_MIX_1 | t)) ^ t
    return ((t ^ (t >>> MULBERRY32_SHIFT_3)) >>> 0) / MULBERRY32_DIVISOR
  }
}
