export interface CollapsedLabel {
  text: string
  visible: boolean
}

export interface CollapsibleLabel {
  text: string
  visible: boolean
}

function withPlusSuffix(text: string): string {
  return text.endsWith('+') ? text : `${text}+`
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
      collapsed[i].text = withPlusSuffix(collapsed[i].text)
      for (let k = i + 1; k < j; k++) {
        collapsed[k].visible = false
      }
    }

    i = j
  }

  return collapsed
}

/**
 * Collapse consecutive equal labels while preserving an existing visible anchor
 * inside each duplicate run.
 */
export function collapseConsecutiveLabelsWithVisibility(
  labels: CollapsibleLabel[],
): CollapsedLabel[] {
  const collapsed: CollapsedLabel[] = labels.map(({ text, visible }) => ({ text, visible }))

  let i = 0
  while (i < collapsed.length) {
    let j = i + 1
    while (j < collapsed.length && collapsed[j].text === collapsed[i].text) {
      j++
    }

    const count = j - i
    if (count > 1) {
      let anchor = i
      for (let k = i; k < j; k++) {
        if (collapsed[k].visible) {
          anchor = k
          break
        }
      }

      const anchorText = collapsed[anchor].text
      for (let k = i; k < j; k++) {
        collapsed[k].visible = false
      }

      collapsed[anchor].visible = true
      collapsed[anchor].text = withPlusSuffix(anchorText)
    }

    i = j
  }

  return collapsed
}
