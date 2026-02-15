/**
 * Sidebar Visualization Wizard
 * Multi-step wizard for data visualization
 */
/* eslint-disable no-restricted-imports -- Sidebar section orchestrates viz-wizard feature */

import {
  VizWizardStep1,
  VizWizardStep2,
  VizWizardStep3,
  WizardProgress,
} from '@/features/viz-wizard'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

export default function SidebarVizWizard() {
  const { currentStep, setCurrentStep } = useVisualizationStore()

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  return (
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
      {/* Header */}
      <div className="mb-2.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
          <i className="fa-solid fa-chart-pie text-emerald-600 text-[10px]"></i>
          Veri Görselleştirme
        </h3>
      </div>

      {/* Wizard Progress */}
      <WizardProgress currentStep={currentStep} />

      {/* Step Content */}
      <div className="mt-3">
        {currentStep === 1 && <VizWizardStep1 onNext={() => goToStep(2)} />}
        {currentStep === 2 && (
          <VizWizardStep2 onBack={() => goToStep(1)} onNext={() => goToStep(3)} />
        )}
        {currentStep === 3 && <VizWizardStep3 onBack={() => goToStep(2)} />}
      </div>
    </section>
  )
}
