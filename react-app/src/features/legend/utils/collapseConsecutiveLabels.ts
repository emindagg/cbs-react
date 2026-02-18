export interface CollapsedLabel {
  text: string
  visible: boolean
}

/**
 * Collapse consecutive equal labels.
 * Example: ["2M", "2M", "2M"] -> ["2M+", hidden, hidden]
 */
export function collapseConsecutiveLabels(labels: string[]): CollapsedLabel[] {
  const collapsed: CollapsedLabel[] = labels.map((text) => ({ text, visible: true }))

  let i = 0
  while (i < collapsed.length) {
    let j = i + 1
    while (j < collapsed.length && collapsed[j].text === collapsed[i].text) {
      j++
    }

    const count = j - i
    if (count > 1) {
      collapsed[i].text = `${collapsed[i].text}+`
      for (let k = i + 1; k < j; k++) {
        collapsed[k].visible = false
      }
    }

    i = j
  }

  return collapsed
}
