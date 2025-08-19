import React from 'react';

const Signup = ({ formData, updateFormData, onNext }) => {
  return (
    <div>
      <h2>Account Setup</h2>
      <div className="form-group">
        <label>Email</label>
        <input 
          className="form-input"
          type="email"
          value={formData.email || ''}
          onChange={(e) => updateFormData({ email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Full Name</label>
        <input 
          className="form-input"
          type="text"
          value={formData.fullName || ''}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
        />
      </div>
      <div className="form-actions">
        <div></div>
        <button className="btn btn-primary" onClick={onNext}>Next</button>
      </div>
    </div>
  );
};

export default Signup;
