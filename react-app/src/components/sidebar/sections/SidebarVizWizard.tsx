/**
 * Sidebar Visualization Wizard
 * Multi-step wizard for data visualization
 */

import { useVisualizationStore } from '../../../stores/useVisualizationStore';
import WizardProgress from '../../visualization/WizardProgress';
import VizWizardStep1 from '../../visualization/VizWizardStep1';
import VizWizardStep2 from '../../visualization/VizWizardStep2';
import VizWizardStep3 from '../../visualization/VizWizardStep3';
import VizWizardStep4 from '../../visualization/VizWizardStep4';

export default function SidebarVizWizard() {
  const { currentStep, setCurrentStep } = useVisualizationStore();

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <section className="rounded-lg px-2 py-2 border border-zinc-100 bg-gradient-to-br from-white to-zinc-50/30 hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <div className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded shadow-sm">
          <i className="fa-solid fa-chart-area text-[10px] text-white"></i>
        </div>
        <h3 className="text-[11px] font-bold text-zinc-800 tracking-tight">
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
        {currentStep === 3 && (
          <VizWizardStep3 onBack={() => goToStep(2)} onNext={() => goToStep(4)} />
        )}
        {currentStep === 4 && <VizWizardStep4 onBack={() => goToStep(3)} />}
      </div>
    </section>
  );
}
