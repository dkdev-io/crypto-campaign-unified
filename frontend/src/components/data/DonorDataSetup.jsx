import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CSVUpload from './CSVUpload';

const DonorDataSetup = ({ onComplete, onSkip }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showAPIConnect, setShowAPIConnect] = useState(false);
  const [loading, setLoading] = useState(false);

  const { userProfile } = useAuth();

  const handleOptionSelect = (option) => {
    setSelectedOption(option);

    if (option === 'upload') {
      setShowUpload(true);
      setShowAPIConnect(false);
    } else if (option === 'api') {
      setShowAPIConnect(true);
      setShowUpload(false);
    } else {
      setShowUpload(false);
      setShowAPIConnect(false);
    }
  };

  const handleUploadComplete = (data) => {
    console.log('Upload completed:', data);
    if (onComplete) {
      onComplete({
        type: 'upload',
        data: data,
      });
    }
  };

  const handleAPISetup = () => {
    // Placeholder for future API connection functionality
    alert('API connection will be available in a future update. Please use CSV upload for now.');
  };

  return (
    <div className="donor-data-setup">
      <div className="setup-header">
        <h2>📊 Set Up Your Donor Data</h2>
        <p>Import your existing donor information to start tracking contributions</p>
      </div>

      {!selectedOption && (
        <div className="data-options">
          <div className="option-cards">
            <div className="option-card" onClick={() => handleOptionSelect('upload')}>
              <div className="option-icon">📁</div>
              <h3>Upload Spreadsheet</h3>
              <p>Upload a CSV file with your donor information</p>
              <div className="option-details">
                <ul>
                  <li>✅ Import existing donor lists</li>
                  <li>✅ CSV, Excel formats supported</li>
                  <li>✅ Automatic data validation</li>
                  <li>✅ Secure storage in your account</li>
                </ul>
              </div>
              <button className="btn btn-outline btn-full">Choose This Option</button>
            </div>

            <div className="option-card" onClick={() => handleOptionSelect('api')}>
              <div className="option-icon">🔌</div>
              <h3>Connect Database/API</h3>
              <p>Connect your existing donor database or CRM system</p>
              <div className="option-details">
                <ul>
                  <li>🔒 Secure API connections</li>
                  <li>📊 Real-time data sync</li>
                  <li>🔄 Automatic updates</li>
                  <li>⚡ Live integration</li>
                </ul>
              </div>
              <div className="coming-soon-badge">Coming Soon</div>
              <button className="btn btn-outline btn-full" disabled>
                Available Soon
              </button>
            </div>

            <div className="option-card skip-card" onClick={() => onSkip && onSkip()}>
              <div className="option-icon">⏭️</div>
              <h3>Skip for Now</h3>
              <p>Set up donor data later from your dashboard</p>
              <div className="option-details">
                <ul>
                  <li>🚀 Get started immediately</li>
                  <li>📝 Add donors manually</li>
                  <li>⚙️ Configure later</li>
                  <li>🔄 Import data anytime</li>
                </ul>
              </div>
              <button className="btn btn-secondary btn-full">Skip This Step</button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="upload-section">
          <div className="section-header">
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedOption('')}>
              ← Back to Options
            </button>
            <h3>📁 Upload Donor Spreadsheet</h3>
          </div>

          <CSVUpload
            onUploadComplete={handleUploadComplete}
            expectedColumns={[
              'full_name',
              'email',
              'phone',
              'address',
              'city',
              'state',
              'zip',
              'employer',
              'occupation',
              'contribution_amount',
              'contribution_date',
            ]}
          />
        </div>
      )}

      {showAPIConnect && (
        <div className="api-section">
          <div className="section-header">
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedOption('')}>
              ← Back to Options
            </button>
            <h3>🔌 Connect Your Database</h3>
          </div>

          <div className="api-placeholder">
            <div className="coming-soon-notice">
              <h4>🚧 Database Connections Coming Soon</h4>
              <p>
                We're working on secure integrations with popular CRM and donor management systems:
              </p>
              <ul>
                <li>📊 ActBlue integration</li>
                <li>💾 NationBuilder sync</li>
                <li>🗄️ Custom database connections</li>
                <li>🔗 CRM API integrations</li>
                <li>📈 Real-time data synchronization</li>
              </ul>

              <div className="notify-section">
                <p>Want to be notified when this feature is ready?</p>
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Enter your email for updates"
                    className="form-input"
                  />
                  <button className="btn btn-primary" onClick={handleAPISetup}>
                    Notify Me
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="setup-info">
        <h4>📋 What happens with your data?</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>🔒 Security:</strong> All data is encrypted and stored securely in your
            dedicated database space
          </div>
          <div className="info-item">
            <strong>👥 Privacy:</strong> Only you and authorized team members can access your donor
            data
          </div>
          <div className="info-item">
            <strong>📊 Processing:</strong> Data is validated and formatted for FEC compliance
          </div>
          <div className="info-item">
            <strong>🔄 Flexibility:</strong> You can update, export, or delete your data anytime
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDataSetup;
