import React from 'react';

const CampaignInfo = ({ formData, updateFormData, onNext, onPrev }) => {
  return (
    <div>
      <h2>Campaign Information</h2>
      <div className="form-group">
        <label>Campaign Name</label>
        <input 
          className="form-input"
          value={formData.campaignName || ''}
          onChange={(e) => updateFormData({ campaignName: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Website</label>
        <input 
          className="form-input"
          value={formData.website || ''}
          onChange={(e) => updateFormData({ website: e.target.value })}
        />
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>Back</button>
        <button className="btn btn-primary" onClick={onNext}>Next</button>
      </div>
    </div>
  );
};

export default CampaignInfo;
