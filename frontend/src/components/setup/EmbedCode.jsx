import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import QRCode from 'qrcode';

const EmbedCode = ({ formData, updateFormData, onPrev, campaignId }) => {
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    console.log('🎯 EmbedCode component mounted with campaignId:', campaignId);
    if (campaignId) {
      generateEmbedCode();
    } else {
      console.warn('⚠️ EmbedCode mounted without campaignId, using default...');
      // Generate proper UUID format for fallback
      const fallbackId = '00000000-0000-4000-8000-' + Date.now().toString().slice(-12).padStart(12, '0');
      const fallbackCode = generateFallbackEmbedCode(fallbackId);
      setEmbedCode(fallbackCode);
      
      const baseUrl = import.meta.env.VITE_APP_URL || 
                     (window.location.hostname.includes('netlify.app') ? window.location.origin : 'https://cryptocampaign.netlify.app');
      const donationUrl = `${baseUrl}/embed-form.html?campaign=${fallbackId}`;
      setTestUrl(donationUrl);
      
      // Generate QR code for fallback
      QRCode.toDataURL(donationUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#2a2a72', light: '#FFFFFF' },
      })
      .then(qrDataUrl => setQrCodeDataUrl(qrDataUrl))
      .catch(err => console.error('QR generation failed:', err));
    }
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
      const { data, error: dbError } = await supabase.rpc('generate_embed_code', {
        p_campaign_id: campaignId,
        p_base_url: window.location.origin,
      });

      if (dbError) throw dbError;

      setEmbedCode(data);
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const donationUrl = `${baseUrl}/embed-form.html?campaign=${campaignId}`;
      setTestUrl(donationUrl);

      // Also generate campaign page URL
      const campaignPageUrl = formData.campaignName
        ? `${baseUrl}/${encodeURIComponent(formData.campaignName.toLowerCase().replace(/\s+/g, '-'))}`
        : null;

      // Generate QR code for the donation URL
      try {
        const qrDataUrl = await QRCode.toDataURL(donationUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#2a2a72',
            light: '#FFFFFF',
          },
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError);
      }

      // Mark setup as completed and trigger donor page automation
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          setup_completed: true,
          setup_completed_at: new Date().toISOString(),
          setup_step: 5,
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
        donorPageGenerated: donorPageGenerated,
        campaignPageUrl: campaignPageUrl,
      });
    } catch (err) {
      console.error('Generate embed code error:', err);
      setError('Failed to generate embed code: ' + err.message);

      // Fallback embed code generation
      const fallbackCode = generateFallbackEmbedCode();
      setEmbedCode(fallbackCode);
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const donationUrl = `${baseUrl}/embed-form.html?campaign=${campaignId}`;
      setTestUrl(donationUrl);

      // Generate QR code for fallback too
      try {
        const qrDataUrl = await QRCode.toDataURL(donationUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#2a2a72',
            light: '#FFFFFF',
          },
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackEmbedCode = (id = campaignId) => {
    // Prioritize production URL for embed code
    const baseUrl = import.meta.env.VITE_APP_URL || 
                   (window.location.hostname.includes('netlify.app') ? window.location.origin : 'https://cryptocampaign.netlify.app');
    
    return `<!-- NEXTRAISE Campaign Contribution Form Embed -->
<div id="nextraise-campaign-embed-${id}"></div>
<script>
(function() {
    var iframe = document.createElement("iframe");
    iframe.src = "${baseUrl}/embed-form.html?campaign=${id}";
    iframe.width = "100%";
    iframe.height = "700";
    iframe.frameBorder = "0";
    iframe.style.border = "1px solid #ddd";
    iframe.style.borderRadius = "8px";
    iframe.style.backgroundColor = "white";
    iframe.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
    document.getElementById("nextraise-campaign-embed-${id}").appendChild(iframe);
    
    // Auto-resize iframe based on content
    window.addEventListener("message", function(event) {
        if (event.data && event.data.type === "resize" && event.data.campaignId === "${id}") {
            iframe.height = event.data.height + "px";
        }
    });
    
    // Set initial height and auto-adjust
    setTimeout(function() {
        iframe.height = "700px";
    }, 1000);
})();
</script>

<!-- Direct Link Alternative -->
<!-- 
You can also direct users to: ${baseUrl}/campaigns/${id}
for a full-page donation experience.
-->`;
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
      {/* Success Banner */}
      <div
        className="crypto-card"
        style={{
          background: 'linear-gradient(135deg, hsl(120 60% 50%), hsl(120 60% 60%))',
          color: 'hsl(var(--crypto-white))',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '2rem',
          border: '1px solid hsl(120 60% 50% / 0.3)',
        }}
      >
        <h3 
          style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.75rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          🎉 Campaign Setup Complete!
        </h3>
        <p 
          style={{ 
            margin: 0, 
            fontSize: '1.1rem', 
            opacity: 0.9,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Your contribution form is live and ready to accept donations
        </p>
      </div>

      {/* Campaign Summary */}
      <div
        className="crypto-card"
        style={{
          background: 'hsl(var(--crypto-gold) / 0.1)',
          border: '1px solid hsl(var(--crypto-gold) / 0.3)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h4 
          style={{ 
            color: 'hsl(var(--crypto-gold))',
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Campaign Details
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            fontSize: '14px',
          }}
        >
          <div>
            <strong>Campaign:</strong>
            <br />
            <span style={{ color: '#6c757d' }}>{formData.campaignName}</span>
          </div>
          <div>
            <strong>Committee:</strong>
            <br />
            <span style={{ color: '#6c757d' }}>{formData.committeeName}</span>
          </div>
          <div>
            <strong>Setup by:</strong>
            <br />
            <span style={{ color: '#6c757d' }}>{formData.userFullName}</span>
          </div>
          <div>
            <strong>Campaign ID:</strong>
            <br />
            <span style={{ color: '#6c757d', fontFamily: 'monospace' }}>{campaignId}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: '#fee',
            color: '#c33',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #fcc',
          }}
        >
          {error}
        </div>
      )}

      {/* Embed Code Section */}
      <div
        className="crypto-card"
        style={{
          background: 'hsl(var(--crypto-navy))',
          border: '1px solid hsl(var(--crypto-white) / 0.2)',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: 'hsl(var(--crypto-blue) / 0.2)',
            padding: '1rem',
            borderBottom: '1px solid hsl(var(--crypto-white) / 0.2)',
            borderRadius: 'var(--radius) var(--radius) 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h4 
            style={{ 
              margin: 0, 
              color: 'hsl(var(--crypto-white))',
              fontSize: '1.25rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Your Embed Code
          </h4>
          <button
            onClick={handleCopyCode}
            disabled={loading || !embedCode}
            style={{
              background: copied ? '#28a745' : 'hsl(var(--crypto-navy))',
              color: 'hsl(var(--crypto-white))',
              border: 'none',
              padding: 'var(--space-sm) var(--space-lg)',
              borderRadius: 'var(--radius)',
              cursor: loading || !embedCode ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              opacity: loading || !embedCode ? 0.6 : 1,
              transition: 'var(--transition-smooth)',
            }}
          >
            {loading ? 'Generating...' : copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div style={{ padding: '1rem' }}>
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6c757d',
              }}
            >
              Generating your embed code...
            </div>
          ) : (
            <div
              style={{
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
                color: '#495057',
              }}
            >
              {embedCode || 'Failed to generate embed code'}
            </div>
          )}
        </div>
      </div>

      {/* QR Code and Test Section */}
      <div
        style={{
          background: '#e7f3ff',
          border: '1px solid #b6d7ff',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h4 style={{ color: '#0066cc', marginTop: 0 }}>QR Code & Testing</h4>
        <p style={{ color: '#004499', marginBottom: '1.5rem' }}>
          Share your donation form via QR code or test it directly:
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* QR Code */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #b6d7ff',
                marginBottom: '1rem',
                display: 'inline-block',
              }}
            >
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Donation Form QR Code" style={{ display: 'block' }} />
              ) : (
                <div
                  style={{
                    width: '200px',
                    height: '200px',
                    background: '#f8f9fa',
                    border: '1px dashed #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                  }}
                >
                  Generating QR...
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#0066cc',
                fontWeight: '500',
              }}
            >
              Scan to Donate
            </div>
          </div>

          {/* Testing Options */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#0066cc', display: 'block', marginBottom: '0.5rem' }}>
                Donation URL:
              </strong>
              <div
                style={{
                  background: 'white',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  border: '1px solid #b6d7ff',
                }}
              >
                {testUrl}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleTestForm}
                disabled={!campaignId}
                style={{
                  background: !campaignId ? 'hsl(var(--crypto-medium-gray))' : 'hsl(var(--crypto-blue))',
                  color: 'hsl(var(--crypto-white))',
                  border: 'none',
                  padding: 'var(--space-sm) var(--space-lg)',
                  borderRadius: 'var(--radius)',
                  cursor: !campaignId ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  opacity: !campaignId ? 0.6 : 1,
                  transition: 'var(--transition-smooth)',
                }}
              >
                Test Form
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(testUrl);
                  // URL copied to clipboard
                }}
                style={{
                  background: '#28a745',
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
                Copy URL
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* NEXTRAISE Profile Section */}
      {formData.donorPageGenerated && formData.donorPageUrl && (
        <div
          className="crypto-card"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--crypto-blue) / 0.2), hsl(var(--crypto-blue) / 0.1))',
            border: '1px solid hsl(var(--crypto-blue) / 0.3)',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 
              style={{ 
                color: 'hsl(var(--crypto-white))',
                margin: '0 0 0.5rem 0',
                fontSize: '1.5rem',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              🎉 Your NEXTRAISE Profile is Live!
            </h3>
            <p 
              style={{ 
                color: 'hsl(var(--crypto-white) / 0.8)',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              We've automatically created a dedicated donation page for your campaign
            </p>
          </div>

          <div
            style={{
              background: 'hsl(var(--crypto-navy) / 0.5)',
              padding: '1.5rem',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
              border: '1px solid hsl(var(--crypto-white) / 0.2)',
            }}
          >
            <h5 
              style={{ 
                color: 'hsl(var(--crypto-gold))',
                marginTop: 0,
                marginBottom: '1rem',
                fontSize: '1.25rem',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Your NEXTRAISE Profile URL
            </h5>
            <div
              style={{
                background: 'hsl(var(--crypto-navy) / 0.8)',
                padding: '1rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1rem',
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '14px',
                wordBreak: 'break-all',
                color: 'hsl(var(--crypto-white))',
                border: '1px solid hsl(var(--crypto-white) / 0.2)',
              }}
            >
              {window.location.origin}
              {formData.donorPageUrl}
            </div>
            <div
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <a
                href={formData.donorPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'hsl(var(--crypto-gold))',
                  color: 'hsl(var(--crypto-navy))',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                }}
              >
                View Your Profile
              </a>
              <button
                onClick={() => {
                  const url = `${window.location.origin}${formData.donorPageUrl}`;
                  navigator.clipboard.writeText(url);
                }}
                style={{
                  background: 'hsl(var(--crypto-blue))',
                  color: 'hsl(var(--crypto-white))',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                }}
              >
                Copy Profile URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Page URL Section */}
      {formData.campaignPageUrl && (
        <div
          style={{
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '2rem',
            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🌐</div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: 'var(--text-heading-sm)' }}>
            Your Campaign Page is Live!
          </h3>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontFamily: 'monospace',
              fontSize: '16px',
              wordBreak: 'break-all',
              fontWeight: '500',
            }}
          >
            {formData.campaignPageUrl}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={formData.campaignPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              Visit Campaign Page
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(formData.campaignPageUrl);
                alert('Campaign URL copied!');
              }}
              style={{
                background: 'white',
                color: '#28a745',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              Copy Campaign URL
            </button>
          </div>
        </div>
      )}


      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        <a
          href="/campaigns/dashboard"
          style={{
            background: 'hsl(var(--crypto-gold))',
            color: 'hsl(var(--crypto-navy))',
            border: '2px solid hsl(var(--crypto-gold))',
            padding: '1rem 2rem',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '1rem',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
          }}
        >
          Go to Campaign Dashboard
        </a>

      </div>

      {/* Simple Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginTop: '2rem' 
      }}>
        <button
          onClick={onPrev}
          style={{
            background: 'hsl(var(--crypto-gold))',
            color: 'hsl(var(--crypto-navy))',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
          }}
        >
          ← Back to Terms
        </button>
      </div>

    </div>
  );
};

export default EmbedCode;
