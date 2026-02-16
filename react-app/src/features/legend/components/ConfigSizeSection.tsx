/**
 * Legend size slider section (LegendConfig içinde kullanılır)
 */

import { SliderWithInput } from '@/components/ui'
import type { LegendConfiguration } from '@/types/visualization'

const SIZE_MIN = 50
const SIZE_MAX = 300
const SIZE_STEP = 10

interface ConfigSizeSectionProps {
  config: LegendConfiguration
  onChange: (config: Partial<LegendConfiguration>) => void
}

export function ConfigSizeSection({ config, onChange }: ConfigSizeSectionProps) {
  return (
    <SliderWithInput
      label="Boyut"
      min={SIZE_MIN}
      max={SIZE_MAX}
      step={SIZE_STEP}
      value={config.size}
      onChange={(size) => onChange({ size })}
    />
  )
}
