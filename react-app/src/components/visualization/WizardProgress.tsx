/**
 * Wizard Progress Component
 * Shows current step and progress bar
 */

interface WizardProgressProps {
  currentStep: number;
}

const STEP_TITLES = ['Dosya Yükle', 'Sütun Eşleştir', 'Sonuçlar', 'Görselleştir'];

export default function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="mb-4 pb-4 border-b border-zinc-200">
      {/* Step title */}
      <h3 className="text-sm font-semibold text-zinc-900 mb-3">
        Adım {currentStep}: {STEP_TITLES[currentStep - 1]}
      </h3>

      {/* Progress indicators */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            {/* Step circle */}
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${
                  step <= currentStep
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-300 text-zinc-600'
                }
              `}
            >
              {step}
            </div>

            {/* Connecting line (except last step) */}
            {index < 3 && (
              <div
                className={`
                  h-0.5 flex-1 mx-1 transition-colors
                  ${step < currentStep ? 'bg-emerald-600' : 'bg-zinc-300'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-between mt-2">
        {STEP_TITLES.map((title, index) => (
          <div key={index} className="flex-1 text-center">
            <p
              className={`text-xs transition-colors ${
                index + 1 === currentStep ? 'text-emerald-700 font-semibold' : 'text-zinc-500'
              }`}
            >
              {title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
