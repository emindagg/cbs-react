/**
 * Sidebar Visualization Wizard
 * Multi-step wizard for data visualization
 */

import { useVisualizationStore } from '../../../stores/useVisualizationStore'
import VizWizardStep1 from '../../visualization/VizWizardStep1'
import VizWizardStep2 from '../../visualization/VizWizardStep2'
import VizWizardStep3 from '../../visualization/VizWizardStep3'
import WizardProgress from '../../visualization/WizardProgress'

export default function SidebarVizWizard() {
  const { currentStep, setCurrentStep } = useVisualizationStore()

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  return (
    <section className="rounded-lg px-2 py-2 border border-zinc-100 bg-linear-to-br from-white to-zinc-50/30 hover:shadow-xs transition-all">
      {/* Header */}
      <div className="mb-2.5 px-0.5">
        <h3 className="text-[11px] font-bold text-zinc-800 tracking-tight">
          VERİ GÖRSELLEŞTİRME
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
