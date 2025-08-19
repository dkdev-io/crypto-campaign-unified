import React from 'react';

const StepIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    'Signup',
    'Campaign Info', 
    'Compliance',
    'Form Customization',
    'Embed Options',
    'Launch'
  ];

  return (
    <div className="step-indicator">
      <h1>Campaign Setup</h1>
      <p>Step {currentStep} of {totalSteps}: {steps[currentStep - 1]}</p>
    </div>
  );
};

export default StepIndicator;
