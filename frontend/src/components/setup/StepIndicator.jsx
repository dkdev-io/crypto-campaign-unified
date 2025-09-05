import React from 'react';

const StepIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    'Admin Setup',
    'Campaign Setup',
    'Connect Your Bank Account', 
    'Create Your Form',
    'Approve Your Form',
    'Terms Agreement',
    'Embed Your Form and Start Fundraising',
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
