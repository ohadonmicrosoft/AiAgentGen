interface Step {
  number: number;
  label: string;
}

interface WizardStepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
  return (
    <div className="flex justify-between mt-2">
      {steps.map((step) => (
        <div key={step.number} className="text-center">
          <div 
            className={`flex items-center justify-center w-8 h-8 mb-1 rounded-full ${
              step.number === currentStep 
                ? "text-primary-foreground bg-primary" 
                : step.number < currentStep 
                  ? "text-primary-foreground bg-primary" 
                  : "text-muted-foreground bg-muted"
            }`}
          >
            {step.number}
          </div>
          <div 
            className={`text-xs font-medium ${
              step.number === currentStep 
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
}
