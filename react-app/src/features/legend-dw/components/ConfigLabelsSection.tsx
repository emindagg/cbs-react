/**
 * Legend label type section: ruler / ranges / custom (LegendConfig içinde kullanılır)
 */

import { useCallback } from 'react'

import type { LegendConfiguration, LegendLabelType } from '@/types/visualization'

interface ConfigLabelsSectionProps {
  config: LegendConfiguration
  onChange: (config: Partial<LegendConfiguration>) => void
  classCount: number
}

const LABEL_OPTIONS: { value: LegendLabelType; label: string }[] = [
  { value: 'ruler', label: 'Cetvel' },
  { value: 'ranges', label: 'Aralıklar' },
  { value: 'custom', label: 'Özel' },
]

const LABEL_DESCRIPTIONS: Record<string, string> = {
  ruler: 'Sadece kırılma noktalarını gösterir',
  ranges: 'Değer aralıklarını gösterir (ör. 0-1000)',
  custom: 'Her sınıf için özel etiket yazın',
}

export function ConfigLabelsSection({ config, onChange, classCount }: ConfigLabelsSectionProps) {
  const type = config.labels.type
  const customLabels = config.labels.customLabels ?? []

  const handleTypeChange = useCallback(
    (newType: LegendLabelType) => {
      if (newType === 'custom') {
        // Initialize custom labels with existing ones or empty strings
        const existing = config.labels.customLabels ?? []
        const labels = Array.from({ length: classCount }, (_, i) => existing[i] ?? '')
        onChange({ labels: { type: 'custom', customLabels: labels } })
      } else {
        // Preserve customLabels when switching away in case user switches back
        onChange({ labels: { type: newType, customLabels: config.labels.customLabels } })
      }
    },
    [classCount, config.labels.customLabels, onChange],
  )

  const handleLabelChange = useCallback(
    (index: number, value: string) => {
      const updated = [...customLabels]
      // Ensure array is large enough
      while (updated.length <= index) updated.push('')
      updated[index] = value
      onChange({ labels: { type: 'custom', customLabels: updated } })
    },
    [customLabels, onChange],
  )

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
              onChange={() => handleTypeChange(opt.value)}
              className="w-3 h-3"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <p className="text-[9px] text-zinc-400 mt-1.5">{LABEL_DESCRIPTIONS[type]}</p>

      {/* Custom labels input fields */}
      {type === 'custom' && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-medium text-zinc-500">
            {classCount} sınıf için etiket girin:
          </p>
          {Array.from({ length: classCount }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-4 text-right flex-shrink-0">
                {i + 1}.
              </span>
              <input
                type="text"
                value={customLabels[i] ?? ''}
                onChange={(e) => handleLabelChange(i, e.target.value)}
                placeholder={`Sınıf ${i + 1} etiketi`}
                className="flex-1 px-2 py-1 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
