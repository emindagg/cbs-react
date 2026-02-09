/**
 * Legend label type section: ruler / ranges / custom (LegendConfig içinde kullanılır)
 */

import type { LegendConfiguration } from '@/types/visualization'

interface ConfigLabelsSectionProps {
  config: LegendConfiguration
  onChange: (config: Partial<LegendConfiguration>) => void
}

const LABEL_OPTIONS: { value: 'ruler' | 'ranges' | 'custom'; label: string }[] = [
  { value: 'ruler', label: 'Cetvel' },
  { value: 'ranges', label: 'Aralıklar' },
  { value: 'custom', label: 'Özel' },
]

const LABEL_DESCRIPTIONS: Record<string, string> = {
  ruler: 'Sadece kırılma noktalarını gösterir',
  ranges: 'Değer aralıklarını gösterir (ör. 0-1000)',
  custom: 'Özel etiketler kullanır',
}

export function ConfigLabelsSection({ config, onChange }: ConfigLabelsSectionProps) {
  const type = config.labels.type
  return (
    <div>
      <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">Etiket Tipi</label>
      <div className="flex gap-2">
        {LABEL_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] rounded border cursor-pointer transition-all
              ${type === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'}
            `}
          >
            <input
              type="radio"
              name="labelType"
              value={opt.value}
              checked={type === opt.value}
              onChange={(e) =>
                onChange({ labels: { type: e.target.value as 'ruler' | 'ranges' | 'custom' } })
              }
              className="w-3 h-3"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <p className="text-[9px] text-zinc-400 mt-1.5">{LABEL_DESCRIPTIONS[type]}</p>
    </div>
  )
}
