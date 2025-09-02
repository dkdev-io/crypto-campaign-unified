import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';

const EmbedCode = ({ formData, updateFormData, onPrev, campaignId }) => {
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testUrl, setTestUrl] = useState('');

  useEffect(() => {
    generateEmbedCode();
  }, [campaignId]);

  const generateEmbedCode = async () => {
    if (!campaignId) {
      setError('Campaign ID is required to generate embed code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Call the database function to generate embed code
      const { data, error: dbError } = await supabase
        .rpc('generate_embed_code', {
          p_campaign_id: campaignId,
          p_base_url: window.location.origin
        });

      if (dbError) throw dbError;

      setEmbedCode(data);
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      setTestUrl(`${baseUrl}/embed-form.html?campaign=${campaignId}`);
      
      // Mark setup as completed and trigger donor page automation
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          setup_completed: true,
          setup_completed_at: new Date().toISOString(),
          setup_step: 5
        })
        .eq('id', campaignId);

      if (updateError) {
        console.error('Failed to update campaign completion status:', updateError);
      }

      // NEW: Check if donor page automation was successful
      let donorPageUrl = null;
      let donorPageGenerated = false;
      
      if (typeof data === 'object' && data.donorPageUrl) {
        donorPageUrl = data.donorPageUrl;
        donorPageGenerated = data.donorPageGenerated;
      }

      updateFormData({ 
        embedCode: typeof data === 'string' ? data : data.embedCode,
        setupCompleted: true,
        embedGenerated: true,
        donorPageUrl: donorPageUrl,
        donorPageGenerated: donorPageGenerated
      });

    } catch (err) {
      console.error('Generate embed code error:', err);
      setError('Failed to generate embed code: ' + err.message);
      
      // Fallback embed code generation
      const fallbackCode = generateFallbackEmbedCode();
      setEmbedCode(fallbackCode);
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      setTestUrl(`${baseUrl}/embed-form.html?campaign=${campaignId}`);
      
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackEmbedCode = () => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `<!-- Campaign Contribution Form Embed -->
<div id="crypto-campaign-embed-${campaignId}"></div>
<script>
(function() {
    var iframe = document.createElement("iframe");
    iframe.src = "${baseUrl}/embed-form.html?campaign=${campaignId}";
    iframe.width = "100%";
    iframe.height = "700";
    iframe.frameBorder = "0";
    iframe.style.border = "1px solid #ddd";
    iframe.style.borderRadius = "8px";
    iframe.style.backgroundColor = "white";
    document.getElementById("crypto-campaign-embed-${campaignId}").appendChild(iframe);
    
    // Auto-resize iframe based on content
    window.addEventListener("message", function(event) {
        if (event.data && event.data.type === "resize" && event.data.campaignId === "${campaignId}") {
            iframe.height = event.data.height + "px";
        }
    });
    
    // Set a reasonable initial height
    setTimeout(function() {
        iframe.height = "700px";
    }, 1000);
})();
</script>`;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = embedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestForm = () => {
    window.open(testUrl, '_blank');
  };

  const handleStartOver = () => {
    if (confirm('Are you sure you want to start over? This will reset the entire setup process.')) {
      window.location.href = '/';
    }
  };

  return (
    <div>
      <h2 style={{ color: '#2a2a72', textAlign: 'center', marginBottom: '1rem' }}>
        🎉 Setup Complete! - Step 5
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Your contribution form is ready to embed on your website
      </p>

      {/* Success Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #28a745, #20c997)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '1rem' }}>🚀</div>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '24px' }}>
          Campaign Setup Completed Successfully!
        </h3>
        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
          Your contribution form is live and ready to accept donations
        </p>
      </div>

      {/* Campaign Summary */}
      <div style={{ 
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          📊 Campaign Details
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          fontSize: '14px'
        }}>
          <div>
            <strong>Campaign:</strong><br />
            <span style={{ color: '#6c757d' }}>{formData.campaignName}</span>
          </div>
          <div>
            <strong>Committee:</strong><br />
            <span style={{ color: '#6c757d' }}>{formData.committeeName}</span>
          </div>
          <div>
            <strong>Setup by:</strong><br />
            <span style={{ color: '#6c757d' }}>{formData.userFullName}</span>
          </div>
          <div>
            <strong>Campaign ID:</strong><br />
            <span style={{ color: '#6c757d', fontFamily: 'monospace' }}>{campaignId}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #fcc'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Embed Code Section */}
      <div style={{ 
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        marginBottom: '2rem'
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
          <h4 style={{ margin: 0, color: '#495057' }}>
            📝 Your Embed Code
          </h4>
          <button
            onClick={handleCopyCode}
            disabled={loading || !embedCode}
            style={{
              background: copied ? '#28a745' : '#2a2a72',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: loading || !embedCode ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading || !embedCode ? 0.7 : 1,
              transition: 'background 0.2s ease'
            }}
          >
            {loading ? '⏳ Generating...' : copied ? '✅ Copied!' : '📋 Copy Code'}
          </button>
        </div>
        
        <div style={{ padding: '1rem' }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center',
              padding: '3rem',
              color: '#6c757d'
            }}>
              ⏳ Generating your embed code...
            </div>
          ) : (
            <div style={{ 
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              padding: '1rem',
              fontFamily: 'Monaco, monospace',
              fontSize: '12px',
              lineHeight: '1.5',
              maxHeight: '300px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: '#495057'
            }}>
              {embedCode || 'Failed to generate embed code'}
            </div>
          )}
        </div>
      </div>

      {/* Test and Preview Section */}
      <div style={{ 
        background: '#e7f3ff',
        border: '1px solid #b6d7ff',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#0066cc', marginTop: 0 }}>
          🔍 Test Your Form
        </h4>
        <p style={{ color: '#004499', marginBottom: '1rem' }}>
          Test your contribution form before embedding it on your website:
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleTestForm}
            disabled={!campaignId}
            style={{
              background: '#0066cc',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              cursor: !campaignId ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: !campaignId ? 0.7 : 1
            }}
          >
            🚀 Test Form (New Window)
          </button>
          <div style={{ 
            fontSize: '14px', 
            color: '#004499',
            padding: '0.75rem 0',
            fontFamily: 'monospace'
          }}>
            {testUrl}
          </div>
        </div>
      </div>

      {/* Implementation Instructions */}
      <div style={{ 
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          🛠️ How to Add to Your Website
        </h4>
        <div style={{ fontSize: '14px', color: '#6c757d', lineHeight: '1.6' }}>
          <ol style={{ paddingLeft: '1.2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Copy the embed code above</strong> using the "Copy Code" button
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Paste it into your website's HTML</strong> where you want the form to appear
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Test the form</strong> to make sure it loads correctly
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Share your donation page</strong> with supporters
            </li>
          </ol>
        </div>
        
        <div style={{ 
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <strong style={{ color: '#856404' }}>💡 Pro Tip:</strong>
          <span style={{ color: '#856404', fontSize: '14px' }}>
            {' '}The form automatically resizes to fit your content and matches your campaign's branding.
          </span>
        </div>
      </div>

      {/* Donor Page Section */}
      {formData.donorPageGenerated && formData.donorPageUrl && (
        <div style={{ 
          background: 'linear-gradient(135deg, #e7f3ff, #f0f9ff)',
          border: '1px solid #b6d7ff',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ color: '#0066cc', margin: '0 0 0.5rem 0' }}>
              Your Donor Page is Live!
            </h3>
            <p style={{ color: '#004499', margin: 0 }}>
              We've automatically created a dedicated donation page for your campaign
            </p>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h5 style={{ color: '#495057', marginTop: 0 }}>
              📄 Your Dedicated Donor Page
            </h5>
            <div style={{ 
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontFamily: 'monospace',
              fontSize: '14px',
              wordBreak: 'break-all'
            }}>
              {window.location.origin}{formData.donorPageUrl}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={formData.donorPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#0066cc',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                🌐 View Your Page
              </a>
              <button
                onClick={() => {
                  const url = `${window.location.origin}${formData.donorPageUrl}`;
                  navigator.clipboard.writeText(url);
                  alert('Page URL copied to clipboard!');
                }}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                📋 Copy Page URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div style={{ 
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h4 style={{ color: '#495057', marginTop: 0 }}>
          📈 What's Next?
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          fontSize: '14px'
        }}>
          {formData.donorPageGenerated && formData.donorPageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>🌐</div>
              <strong>Share Donor Page</strong>
              <div style={{ color: '#6c757d', marginTop: '0.25rem' }}>
                Direct supporters to your custom page
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>🌐</div>
              <strong>Embed on Website</strong>
              <div style={{ color: '#6c757d', marginTop: '0.25rem' }}>
                Add the form to your campaign website
              </div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>📱</div>
            <strong>Share on Social</strong>
            <div style={{ color: '#6c757d', marginTop: '0.25rem' }}>
              Share your donation page on social media
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>📊</div>
            <strong>Monitor Donations</strong>
            <div style={{ color: '#6c757d', marginTop: '0.25rem' }}>
              Track contributions in the admin panel
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>⚖️</div>
            <strong>Stay Compliant</strong>
            <div style={{ color: '#6c757d', marginTop: '0.25rem' }}>
              Regular FEC reporting and compliance
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '2rem'
      }}>
        <a
          href="/admin"
          style={{
            background: '#2a2a72',
            color: 'white',
            border: 'none',
            padding: '1rem 1.5rem',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          📊 Go to Admin Panel
        </a>
        
        <button
          onClick={handleTestForm}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '1rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          🚀 Test Form Again
        </button>
      </div>

      {/* Navigation */}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onPrev}>
          ← Back to Terms
        </button>
        <button className="btn" onClick={handleStartOver}>
          🔄 Setup New Campaign
        </button>
      </div>

      {/* Final Success Message */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '1rem' }}>🎉</div>
        <h4 style={{ color: '#495057', margin: '0 0 0.5rem 0' }}>
          Congratulations!
        </h4>
        <p style={{ color: '#6c757d', margin: 0 }}>
          Your campaign contribution system is now live and ready to help you raise funds 
          for your political campaign in compliance with FEC regulations.
        </p>
      </div>
    </div>
  );
};

export default EmbedCode;