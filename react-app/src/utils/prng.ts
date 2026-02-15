/**
 * Seeded PRNG — Tekrarlanabilir nokta yerleşimi için
 *
 * mulberry32: 32-bit seeded pseudo-random number generator
 * hashString: djb2 string hash (feature adından seed üretir)
 */

/** djb2 string hash → 32-bit unsigned integer */
export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0
  }
  return hash
}

/** mulberry32 — Returns a function that yields [0,1) on each call */
export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
