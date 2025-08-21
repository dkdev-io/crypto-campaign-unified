import React from 'react';

const Compliance = ({ formData, updateFormData, onNext, onPrev }) => {
  return (
    <div>
      <h2>Legal Compliance</h2>
      <div className="form-group">
        <label>Candidate/Committee Name</label>
        <input 
          className="form-input"
          value={formData.candidateName || ''}
          onChange={(e) => updateFormData({ candidateName: e.target.value })}
          placeholder="e.g., John Smith for Senate"
        />
      </div>
      
      <div style={{ background: '#f0f8ff', padding: '1rem', borderRadius: '4px', margin: '1rem 0' }}>
        <h3>Required FEC Disclosure</h3>
        <p><strong>All donors must certify:</strong></p>
        <ul>
          <li>I am a U.S. citizen or lawfully admitted permanent resident</li>
          <li>This contribution is made from my own funds</li>
          <li>I am not a federal contractor</li>
          <li>I am at least eighteen years old</li>
        </ul>
      </div>

      <div className="form-group">
        <label>
          <input 
            type="checkbox"
            checked={formData.complianceAcknowledged || false}
            onChange={(e) => updateFormData({ complianceAcknowledged: e.target.checked })}
          />
          I acknowledge FEC compliance requirements
        </label>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>Back</button>
        <button className="btn btn-primary" onClick={onNext}>Next</button>
      </div>
    </div>
  );
};

export default Compliance;
