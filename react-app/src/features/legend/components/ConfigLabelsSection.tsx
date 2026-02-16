/**
 * Legend label type section: ruler / ranges / custom (LegendConfig içinde kullanılır)
 */

import { useCallback, useMemo } from 'react'

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
  // Memoize customLabels to prevent dependency changes on every render
  const customLabels = useMemo(() => config.labels.customLabels ?? [], [config.labels.customLabels])

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
      <div className="flex rounded-md border border-zinc-200 overflow-hidden">
        {LABEL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleTypeChange(opt.value)}
            className={`flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors ${
              type === opt.value
                ? 'bg-zinc-800 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {opt.label}
          </button>
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
