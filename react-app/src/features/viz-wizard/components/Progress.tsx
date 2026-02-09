/**
 * Wizard Progress Component
 * Compact step progress indicator
 */

interface WizardProgressProps {
  currentStep: number;
}

const STEPS = [
  { num: 1, label: 'Dosya', icon: 'fa-file-arrow-up' },
  { num: 2, label: 'Eşleşme', icon: 'fa-table-columns' },
  { num: 3, label: 'Görselleştir', icon: 'fa-map' },
]

export default function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="relative mb-3">
      {/* Progress bar background */}
      <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-zinc-200" />

      {/* Active progress bar */}
      <div
        className="absolute top-2.5 left-0 h-0.5 bg-linear-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
        style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
      />

      {/* Steps */}
      <div className="relative flex items-center justify-between">
        {STEPS.map((step) => (
          <div key={step.num} className="flex flex-col items-center gap-1">
            {/* Step indicator */}
            <div
              className={`
                w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                transition-all duration-300 border-2
                ${
          step.num === currentStep
            ? 'bg-emerald-600 border-emerald-600 text-white scale-110 shadow-xs'
            : step.num < currentStep
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'bg-white border-zinc-300 text-zinc-400'
          }
              `}
            >
              {step.num < currentStep ? (
                <i className="fa-solid fa-check text-[8px]" />
              ) : (
                <i className={`fa-solid ${step.icon} text-[8px]`} />
              )}
            </div>

            {/* Step label */}
            <span
              className={`
                text-[9px] font-medium transition-colors whitespace-nowrap
                ${step.num === currentStep ? 'text-emerald-700' : 'text-zinc-400'}
              `}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
