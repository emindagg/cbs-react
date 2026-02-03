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
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">
        Veri Görselleştirme
      </h3>

      {/* Wizard Progress */}
      <WizardProgress currentStep={currentStep} />

      {/* Step Content */}
      <div className="mt-4">
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
