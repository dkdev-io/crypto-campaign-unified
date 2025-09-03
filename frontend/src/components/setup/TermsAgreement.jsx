import React, { useState } from 'react';

const TermsAgreement = ({ formData, updateFormData, onNext, onPrev }) => {
  const [agreements, setAgreements] = useState({
    terms: formData.termsAccepted || false,
    privacy: formData.privacyAccepted || false,
    compliance: formData.complianceAccepted || false
  });
  const [showErrors, setShowErrors] = useState(false);

  const handleAgreementChange = (field, value) => {
    const newAgreements = { ...agreements, [field]: value };
    setAgreements(newAgreements);
    
    // Update form data
    updateFormData({
      [`${field}Accepted`]: value,
      allTermsAccepted: Object.values(newAgreements).every(v => v)
    });

    if (showErrors) {
      setShowErrors(false);
    }
  };

  const handleLaunch = () => {
    const allAccepted = Object.values(agreements).every(v => v);
    
    if (!allAccepted) {
      setShowErrors(true);
      return;
    }

    // Record agreement timestamp and proceed
    updateFormData({
      termsAcceptedAt: new Date().toISOString(),
      termsIpAddress: '127.0.0.1', // In production, get real IP
      setupCompleted: true
    });

    onNext();
  };

  const allTermsAccepted = Object.values(agreements).every(v => v);

  return (
    <div>
      <h2 style={{ color: '#2a2a72', textAlign: 'center', marginBottom: '1rem' }}>
        📋 Terms & Conditions - Step 6
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Review and accept our terms to launch your contribution form
      </p>

      {/* Campaign Summary */}
      <div style={{ 
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          📊 Setup Summary
        </h4>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Campaign:</strong> {formData.campaignName || 'Not specified'}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Setup by:</strong> {formData.userFullName || 'Not specified'} ({formData.email || 'Not specified'})
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Committee:</strong> {formData.committeeName || 'Not specified'}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Bank Account:</strong> {
              formData.bankAccountVerified ? 
                `✅ Connected (${formData.bankAccountInfo?.accountName})` : 
                formData.skipBankConnection ? 
                  '⚠️ Skipped (Dev Mode)' : 
                  '❌ Not connected'
            }
          </div>
        </div>
      </div>

      {/* Terms and Conditions Sections */}
      <div style={{ marginBottom: '2rem' }}>
        
        {/* Service Terms */}
        <div style={{ 
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            background: '#f8f9fa',
            padding: '1rem',
            borderBottom: '1px solid #e9ecef',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0, color: '#495057' }}>
              📜 Terms of Service
            </h5>
            <label style={{ display: 'flex', alignItems: 'center', margin: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreements.terms}
                onChange={(e) => handleAgreementChange('terms', e.target.checked)}
                style={{ 
                  marginRight: '0.5rem',
                  transform: 'scale(1.2)',
                  accentColor: '#2a2a72'
                }}
              />
              <span style={{ 
                fontWeight: '500',
                color: agreements.terms ? '#28a745' : showErrors ? '#dc3545' : '#495057'
              }}>
                I Accept
              </span>
            </label>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              height: '150px',
              overflowY: 'auto',
              background: '#fafbfc',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              padding: '1rem',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#495057'
            }}>
              <p><strong>Lorem Ipsum Terms of Service</strong></p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
                nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
                in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
                doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
                veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
              <p>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, 
                sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Policy */}
        <div style={{ 
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            background: '#f8f9fa',
            padding: '1rem',
            borderBottom: '1px solid #e9ecef',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0, color: '#495057' }}>
              🔒 Privacy Policy
            </h5>
            <label style={{ display: 'flex', alignItems: 'center', margin: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreements.privacy}
                onChange={(e) => handleAgreementChange('privacy', e.target.checked)}
                style={{ 
                  marginRight: '0.5rem',
                  transform: 'scale(1.2)',
                  accentColor: '#2a2a72'
                }}
              />
              <span style={{ 
                fontWeight: '500',
                color: agreements.privacy ? '#28a745' : showErrors ? '#dc3545' : '#495057'
              }}>
                I Accept
              </span>
            </label>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              height: '150px',
              overflowY: 'auto',
              background: '#fafbfc',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              padding: '1rem',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#495057'
            }}>
              <p><strong>Lorem Ipsum Privacy Policy</strong></p>
              <p>
                At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis 
                praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias 
                excepturi sint occaecati cupiditate non provident.
              </p>
              <p>
                Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum 
                et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
              </p>
              <p>
                Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit 
                quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.
              </p>
              <p>
                Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus 
                saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Agreement */}
        <div style={{ 
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            background: '#f8f9fa',
            padding: '1rem',
            borderBottom: '1px solid #e9ecef',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0, color: '#495057' }}>
              ⚖️ FEC Compliance Agreement
            </h5>
            <label style={{ display: 'flex', alignItems: 'center', margin: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreements.compliance}
                onChange={(e) => handleAgreementChange('compliance', e.target.checked)}
                style={{ 
                  marginRight: '0.5rem',
                  transform: 'scale(1.2)',
                  accentColor: '#2a2a72'
                }}
              />
              <span style={{ 
                fontWeight: '500',
                color: agreements.compliance ? '#28a745' : showErrors ? '#dc3545' : '#495057'
              }}>
                I Accept
              </span>
            </label>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              height: '150px',
              overflowY: 'auto',
              background: '#fafbfc',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              padding: '1rem',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#495057'
            }}>
              <p><strong>Lorem Ipsum Compliance Terms</strong></p>
              <p>
                Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis 
                voluptatibus maiores alias consequatur aut perferendis doloribus asperiores 
                repellat. Sed ut perspiciatis unde omnis iste natus error.
              </p>
              <p>
                Accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab 
                illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
              <p>
                Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, 
                adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et 
                dolore magnam aliquam quaerat voluptatem.
              </p>
              <p>
                Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit 
                laboriosam, nisi ut aliquid ex ea commodi consequatur.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {showErrors && !allTermsAccepted && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #fcc',
          textAlign: 'center'
        }}>
          ❌ You must accept all terms and conditions to continue
        </div>
      )}

      {/* Launch Section */}
      <div style={{ 
        background: allTermsAccepted ? '#d4edda' : '#f8f9fa',
        border: `1px solid ${allTermsAccepted ? '#c3e6cb' : '#e9ecef'}`,
        borderRadius: '8px',
        padding: '2rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>
          {allTermsAccepted ? '🚀' : '📝'}
        </div>
        <h4 style={{ 
          color: allTermsAccepted ? '#155724' : '#495057',
          marginBottom: '1rem' 
        }}>
          {allTermsAccepted ? 
            'Ready to Launch!' : 
            'Accept All Terms to Continue'
          }
        </h4>
        <p style={{ 
          color: allTermsAccepted ? '#155724' : '#6c757d',
          marginBottom: '2rem',
          maxWidth: '500px',
          margin: '0 auto 2rem auto'
        }}>
          {allTermsAccepted ? 
            'All agreements accepted. You can now launch your contribution form and start accepting donations.' :
            'Please review and accept all terms and conditions above to proceed with launching your campaign.'
          }
        </p>
        
        <button
          onClick={handleLaunch}
          disabled={!allTermsAccepted}
          style={{
            background: allTermsAccepted ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '6px',
            cursor: allTermsAccepted ? 'pointer' : 'not-allowed',
            fontSize: '18px',
            fontWeight: '600',
            opacity: allTermsAccepted ? 1 : 0.6,
            transform: allTermsAccepted ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 0.2s ease'
          }}
        >
          {allTermsAccepted ? '🚀 Launch Contribution Form' : '📝 Accept Terms First'}
        </button>
      </div>

      {/* Navigation */}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>
          ← Back to Bank Connection
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleLaunch}
          disabled={!allTermsAccepted}
        >
          Complete Setup →
        </button>
      </div>

      {/* Legal Notice */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#856404'
      }}>
        <strong>⚠️ Legal Notice:</strong> The terms above are Lorem Ipsum placeholder text for 
        development purposes. In production, replace with actual legal agreements reviewed by 
        qualified legal counsel specializing in campaign finance law and FEC compliance.
      </div>
    </div>
  );
};

export default TermsAgreement;