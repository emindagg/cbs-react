/**
 * Min / Center / Max input fields for CustomRangeConfig
 */

import type { CustomRangeErrors } from './hooks/useCustomRange'

interface CustomRangeConfigFieldsProps {
  localMin: string
  localCenter: string
  localMax: string
  errors: CustomRangeErrors
  onValidateAndUpdate: (field: 'min' | 'center' | 'max', value: string) => void
  autoMin: number
  autoCenter: number
  autoMax: number
}

function FieldInput({
  label,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  error?: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-medium text-zinc-600">{label}</label>
        <span className="text-[9px] text-zinc-400">Otomatik: {placeholder}</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full px-2.5 py-1.5 text-[11px] border rounded
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-zinc-200 focus:ring-blue-500'}
          focus:outline-none focus:ring-1
        `}
      />
      {error && <p className="text-[9px] text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

export function CustomRangeConfigFields({
  localMin,
  localCenter,
  localMax,
  errors,
  onValidateAndUpdate,
  autoMin,
  autoCenter,
  autoMax,
}: CustomRangeConfigFieldsProps) {
  return (
    <div className="space-y-2.5">
      <FieldInput
        label="Minimum"
        value={localMin}
        error={errors.min}
        placeholder={autoMin.toFixed(2)}
        onChange={(v) => onValidateAndUpdate('min', v)}
      />
      <FieldInput
        label="Orta"
        value={localCenter}
        error={errors.center}
        placeholder={autoCenter.toFixed(2)}
        onChange={(v) => onValidateAndUpdate('center', v)}
      />
      <FieldInput
        label="Maksimum"
        value={localMax}
        error={errors.max}
        placeholder={autoMax.toFixed(2)}
        onChange={(v) => onValidateAndUpdate('max', v)}
      />
      <div className="text-[9px] text-zinc-400 leading-relaxed pt-1 border-t border-zinc-100">
        💡 Özel aralık kullanarak farklı zaman dilimlerindeki haritaları aynı renk skalasıyla
        karşılaştırabilirsiniz.
      </div>
    </div>
  )
}
