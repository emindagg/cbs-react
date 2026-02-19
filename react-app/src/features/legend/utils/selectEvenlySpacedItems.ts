/**
 * Select a target number of items while preserving first/last and spacing
 * the rest as evenly as possible.
 */
export function selectEvenlySpacedItems<T>(items: T[], targetCount: number): T[] {
  const total = items.length

  if (targetCount <= 0 || total === 0) return []
  if (targetCount >= total) return [...items]
  if (targetCount === 1) return [items[0]]

  const lastIndex = total - 1
  const indices: number[] = [0]
  let previous = 0

  for (let i = 1; i < targetCount - 1; i++) {
    const ideal = Math.round((i * lastIndex) / (targetCount - 1))
    const maxAllowed = lastIndex - (targetCount - i - 1)
    const next = Math.max(previous + 1, Math.min(ideal, maxAllowed))
    indices.push(next)
    previous = next
  }

  indices.push(lastIndex)
  return indices.map((index) => items[index]!)
}

