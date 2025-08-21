import React from 'react';
import SetupWizard from './components/setup/SetupWizard';
import DonorForm from './components/DonorForm';

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaign');
  
  if (campaignId) {
    return <DonorForm campaignId={campaignId} />;
  }
  
  return <SetupWizard />;
}

export default App;
