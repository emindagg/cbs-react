/**
 * Basamak (steps) ölçek ayarları: sınıf sayısı + sınıflandırma yöntemi (VizWizardStep3 içinde kullanılır)
 */

import type { ClassificationMethod } from '@/types/visualization'

import { CustomBreaksInput } from './CustomBreaksInput'
import { CLASS_COUNT_OPTIONS } from '../constants'

interface StepsSectionProps {
  classCount: number
  classificationMethod: ClassificationMethod
  customBreaks: number[] | undefined
  setClassCount: (n: number) => void
  setClassificationMethod: (m: ClassificationMethod) => void
  setCustomBreaks: (breaks: number[]) => void
}

const CLASSIFICATION_METHODS: { value: ClassificationMethod; label: string; description: string }[] = [
  { value: 'jenks', label: 'Doğal Kırılmalar (Jenks)', description: 'Verideki doğal grupları bulur' },
  { value: 'equal', label: 'Doğrusal (Eşit Aralık)', description: 'Eşit genişlikte aralıklar' },
  { value: 'quantile', label: 'Çeyrekler (Eşit Sayı)', description: 'Her sınıfta eşit sayıda öğe' },
  { value: 'custom', label: 'Özel Sınıflar', description: 'Sınır değerlerini elle belirleyin' },
]
export function StepsSection({
  classCount,
  classificationMethod,
  customBreaks,
  setClassCount,
  setClassificationMethod,
  setCustomBreaks,
}: StepsSectionProps) {
  const isCustom = classificationMethod === 'custom'

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
      <div>
        {!isCustom && (
          <div className="flex items-center gap-3 mb-2">
            <label className="text-[11px] font-semibold text-zinc-700 min-w-[60px]">Basamak</label>
            <select
              value={classCount}
              onChange={(e) => setClassCount(Number.parseInt(e.target.value, 10))}
              className="w-16 px-2 py-1.5 text-[11px] text-center border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {CLASS_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        <select
          value={classificationMethod}
          onChange={(e) =>
            setClassificationMethod(e.target.value as ClassificationMethod)
          }
          className="w-full px-3 py-2 text-[11px] border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        >
          {CLASSIFICATION_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>

        <p className="text-[9px] text-zinc-500 mt-1.5 leading-relaxed">
          {CLASSIFICATION_METHODS.find((m) => m.value === classificationMethod)?.description}
        </p>

        {isCustom && (
          <div className="mt-2">
            <CustomBreaksInput
              customBreaks={customBreaks}
              onChange={setCustomBreaks}
            />
          </div>
        )}
      </div>
    </div>
  )
}
