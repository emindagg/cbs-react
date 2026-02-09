/**
 * Basamak (steps) ölçek ayarları: sınıf sayısı + sınıflandırma yöntemi (VizWizardStep3 içinde kullanılır)
 */

import type { ClassificationMethod } from '../../types/visualization'

interface VizWizardStep3StepsSectionProps {
  classCount: number
  classificationMethod: ClassificationMethod
  setClassCount: (n: number) => void
  setClassificationMethod: (m: ClassificationMethod) => void
}

const CLASSIFICATION_METHODS: { value: ClassificationMethod; label: string; description: string }[] = [
  { value: 'jenks', label: 'Doğal Kırılmalar (Jenks)', description: 'Verideki doğal grupları bulur' },
  { value: 'equal', label: 'Doğrusal (Eşit Aralık)', description: 'Eşit genişlikte aralıklar' },
  { value: 'quantile', label: 'Çeyrekler (Eşit Sayı)', description: 'Her sınıfta eşit sayıda öğe' },
  { value: 'kmeans', label: 'K-Ortalamalar', description: 'Benzer değerleri otomatik gruplar' },
  { value: 'logarithmic', label: 'Logaritmik', description: 'Çok geniş değer aralıkları için logaritmik ölçekleme' },
  { value: 'rounded-sm', label: 'Yuvarlanmış Değerler', description: 'Güzel yuvarlak sayılar (10, 20, 50...)' },
  { value: 'custom', label: 'Özel Aralıklar', description: 'Özel aralıklar tanımla' },
]

export function VizWizardStep3StepsSection({
  classCount,
  classificationMethod,
  setClassCount,
  setClassificationMethod,
}: VizWizardStep3StepsSectionProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <label className="text-[11px] font-semibold text-zinc-700 min-w-[60px]">Basamak</label>
          <input
            type="number"
            min={3}
            max={9}
            value={classCount}
            onChange={(e) => {
              const count = parseInt(e.target.value)
              if (count >= 3 && count <= 9) {
                setClassCount(count)
              }
            }}
            className="w-16 px-2 py-1.5 text-[11px] text-center border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

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
      </div>
    </div>
  )
}
