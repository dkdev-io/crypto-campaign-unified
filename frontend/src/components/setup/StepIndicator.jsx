import React from 'react';

const StepIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    'Campaign Info',
    'Committee Search',
    'Bank Connection',
    'Form Customization',
    'Style Confirmation',
    'Launch & QR Code',
    'Terms Agreement',
  ];

  return (
    <div className="step-indicator">
      <h1>Campaign Setup</h1>
      <p>
        Step {currentStep} of {totalSteps}: {steps[currentStep - 1]}
      </p>
    </div>
  );
};

export default StepIndicator;
