import React from 'react';

const Compliance = ({ formData, updateFormData, onNext, onPrev }) => {
  return (
    <div>
      <h2
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: 'hsl(var(--crypto-white))',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Legal Compliance
      </h2>
      <p
        style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'hsl(var(--crypto-gold))',
          fontSize: '1rem',
          fontWeight: '500',
        }}
      >
        Step 6 of 8: Acknowledge FEC compliance requirements
      </p>
      <div className="form-group">
        <label>Candidate/Committee Name</label>
        <input
          value={formData.candidateName || ''}
          onChange={(e) => updateFormData({ candidateName: e.target.value })}
          placeholder="e.g., John Smith for Senate"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid hsl(var(--crypto-blue) / 0.4)',
            borderRadius: 'var(--radius)',
            background: 'hsl(223 57% 25% / 0.5)',
            color: 'hsl(var(--crypto-white))',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            transition: 'var(--transition-smooth)',
          }}
        />
      </div>

      <div
        style={{ background: '#f0f8ff', padding: '1rem', borderRadius: '4px', margin: '1rem 0' }}
      >
        <h3>Required FEC Disclosure</h3>
        <p>
          <strong>All donors must certify:</strong>
        </p>
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
        <button
          onClick={onPrev}
          style={{
            background: 'hsl(var(--crypto-gold))',
            color: 'hsl(var(--crypto-navy))',
            border: 'none',
            padding: 'var(--space-sm) var(--space-lg)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            transition: 'var(--transition-smooth)',
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          style={{
            background: 'hsl(var(--crypto-navy))',
            color: 'hsl(var(--crypto-white))',
            border: 'none',
            padding: 'var(--space-sm) var(--space-lg)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            transition: 'var(--transition-smooth)',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Compliance;
