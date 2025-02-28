import { useState } from 'react';
import { Card } from '@/components/ui/card';
import WizardStepIndicator from './WizardStepIndicator';
import AgentBasicInfo from './AgentBasicInfo';
import AgentConfiguration from './AgentConfiguration';
import AgentPrompt from './AgentPrompt';
import AgentReview from './AgentReview';

interface AgentWizardProps {
  preview?: boolean;
}

export default function AgentWizard({ preview = false }: AgentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom',
    temperature: 0.7,
    maxTokens: 2048,
    model: 'gpt-4o',
    systemPrompt: '',
    responseStyle: 'formal',
  });

  const totalSteps = 4;

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className="border rounded-lg border-border">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Agent Creation Wizard</h3>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute top-0 bottom-0 left-0 rounded-full bg-primary"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Step Indicators */}
        <WizardStepIndicator
          currentStep={currentStep}
          steps={[
            { number: 1, label: 'Basic Info' },
            { number: 2, label: 'Configuration' },
            { number: 3, label: 'Prompt' },
            { number: 4, label: 'Review' },
          ]}
        />
      </div>

      <div className="p-5">
        {currentStep === 1 && (
          <AgentBasicInfo
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            preview={preview}
          />
        )}

        {currentStep === 2 && (
          <AgentConfiguration
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            preview={preview}
          />
        )}

        {currentStep === 3 && (
          <AgentPrompt
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            preview={preview}
          />
        )}

        {currentStep === 4 && (
          <AgentReview formData={formData} onBack={handleBack} preview={preview} />
        )}
      </div>
    </Card>
  );
}
