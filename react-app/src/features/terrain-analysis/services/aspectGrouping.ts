import type { AspectDirection, TerrainAspectClass, TerrainAspectResult } from '../types'
import { ASPECT_CLASS_DEFINITIONS } from './aspectClasses'

const PERCENT_MULTIPLIER = 100

export const NORTH_GROUP_DIRECTIONS: AspectDirection[] = ['north', 'northeast', 'northwest']
export const EAST_WEST_DIRECTIONS: AspectDirection[] = ['east', 'west']
export const SOUTH_GROUP_DIRECTIONS: AspectDirection[] = ['south', 'southeast', 'southwest']

export interface DirectionGroup {
  key: 'north' | 'east-west' | 'south'
  label: string
  members: string
  /** Yöne karşılık gelen renkler (lejantta mini-noktalar için) */
  swatchColors: string[]
  percent: number
  areaKm2: number
}

function colorFor(direction: AspectDirection): string {
  return ASPECT_CLASS_DEFINITIONS.find((d) => d.direction === direction)?.color ?? '#a9a9a9'
}

function sumPixelsFor(classes: readonly TerrainAspectClass[], dirs: readonly AspectDirection[]): number {
  return classes
    .filter((cls) => dirs.includes(cls.direction))
    .reduce((sum, cls) => sum + cls.pixelCount, 0)
}

/**
 * Bakı sınıflarını üç tarafsız yön grubuna toplar:
 *  - Kuzey grubu (K + KD + KB)
 *  - Doğu - Batı (D + B)
 *  - Güney grubu (G + GD + GB)
 *
 * "Düz" sınıfı ratio paydasında yer alır (toplam piksel) ama kendisi hiçbir gruba dahil değildir;
 * bu yüzden grupların % toplamı düz alan oranı kadar 100'den eksiktir.
 *
 * Yarımküre fark etmeksizin değer yargısı taşımaz — "güneşli/gölgeli" yorumu dışarıda kalır.
 */
export function computeDirectionGroups(
  result: Pick<TerrainAspectResult, 'classes' | 'areaKm2'>,
): DirectionGroup[] {
  const totalPixels = result.classes.reduce((sum, c) => sum + c.pixelCount, 0)

  const buildGroup = (
    key: DirectionGroup['key'],
    label: string,
    members: string,
    dirs: AspectDirection[],
  ): DirectionGroup => {
    const pixels = sumPixelsFor(result.classes, dirs)
    const ratio = totalPixels > 0 ? pixels / totalPixels : 0
    return {
      key,
      label,
      members,
      swatchColors: dirs.map(colorFor),
      percent: ratio * PERCENT_MULTIPLIER,
      areaKm2: ratio * result.areaKm2,
    }
  }

  return [
    buildGroup('north', 'Kuzey grubu', 'K · KD · KB', NORTH_GROUP_DIRECTIONS),
    buildGroup('east-west', 'Doğu - Batı', 'D · B', EAST_WEST_DIRECTIONS),
    buildGroup('south', 'Güney grubu', 'G · GD · GB', SOUTH_GROUP_DIRECTIONS),
  ]
}
