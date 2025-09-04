import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDataUpload } from '../../hooks/useDataUpload';

const CSVUpload = ({ onUploadComplete, expectedColumns = [] }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [validationResults, setValidationResults] = useState(null);

  const fileInputRef = useRef(null);
  const { user, userProfile } = useAuth();
  const { uploading, progress, processCSVUpload } = useDataUpload();

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setSuccess('');
    setValidationResults(null);

    // Validate file type
    if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      setErrors(['Please select a CSV or Excel file']);
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors(['File size must be less than 10MB']);
      return;
    }

    // Read and preview file
    await previewFile(selectedFile);
  };

  const previewFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');

          if (lines.length < 2) {
            setErrors(['File must contain at least a header row and one data row']);
            resolve();
            return;
          }

          // Parse CSV (simple parsing - for production use a proper CSV library)
          const headers = parseCSVLine(lines[0]);
          const sampleRows = lines.slice(1, 6).map((line) => parseCSVLine(line));

          const previewData = {
            headers,
            sampleRows: sampleRows.filter((row) => row.some((cell) => cell && cell.trim())),
            totalRows: lines.length - 1,
          };

          setPreview(previewData);
          validateData(previewData);
        } catch (error) {
          setErrors(['Error reading file: ' + error.message]);
        }
        resolve();
      };

      reader.onerror = () => {
        setErrors(['Error reading file']);
        resolve();
      };

      reader.readAsText(file);
    });
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const validateData = (previewData) => {
    const validation = {
      hasRequiredColumns: false,
      columnMapping: {},
      issues: [],
      recommendations: [],
    };

    // Check for common donor data columns
    const commonColumns = ['name', 'email', 'phone', 'address', 'amount', 'date'];
    const headers = previewData.headers.map((h) => h.toLowerCase());

    // Map columns to expected fields
    const fieldMappings = {
      full_name: ['name', 'full_name', 'donor_name', 'first_name', 'last_name'],
      email: ['email', 'email_address', 'donor_email'],
      phone: ['phone', 'phone_number', 'mobile', 'telephone'],
      address: ['address', 'street', 'street_address', 'addr'],
      city: ['city', 'town'],
      state: ['state', 'province', 'region'],
      zip: ['zip', 'zipcode', 'postal_code', 'postcode'],
      employer: ['employer', 'company', 'organization'],
      occupation: ['occupation', 'job', 'job_title', 'profession'],
      contribution_amount: ['amount', 'contribution_amount', 'donation_amount', 'total'],
      contribution_date: ['date', 'contribution_date', 'donation_date', 'transaction_date'],
    };

    let mappedFields = 0;
    Object.keys(fieldMappings).forEach((field) => {
      const possibleHeaders = fieldMappings[field];
      const foundHeader = headers.find((h) => possibleHeaders.includes(h));

      if (foundHeader) {
        validation.columnMapping[field] = foundHeader;
        mappedFields++;
      }
    });

    if (mappedFields >= 3) {
      validation.hasRequiredColumns = true;
    } else {
      validation.issues.push(
        'Could not identify enough required columns (need at least: name, email, amount)'
      );
    }

    // Check data quality in sample rows
    if (previewData.sampleRows.length > 0) {
      const firstRow = previewData.sampleRows[0];

      // Check for email format
      if (validation.columnMapping.email) {
        const emailIndex = headers.indexOf(validation.columnMapping.email);
        const sampleEmail = firstRow[emailIndex];
        if (sampleEmail && !sampleEmail.match(/\S+@\S+\.\S+/)) {
          validation.issues.push('Email format may not be valid');
        }
      }

      // Check for amount format
      if (validation.columnMapping.contribution_amount) {
        const amountIndex = headers.indexOf(validation.columnMapping.contribution_amount);
        const sampleAmount = firstRow[amountIndex];
        if (sampleAmount && !sampleAmount.match(/^\$?[\d,]+\.?\d*$/)) {
          validation.recommendations.push(
            'Amount values should be numeric (e.g., 100.00 or $100.00)'
          );
        }
      }
    }

    if (previewData.totalRows > 1000) {
      validation.recommendations.push(
        `Large file detected (${previewData.totalRows} rows). Processing may take a few minutes.`
      );
    }

    setValidationResults(validation);
  };

  const handleUpload = async () => {
    if (!file || !user || !preview) return;

    setErrors([]);
    setSuccess('');

    try {
      // Use the hook to process the upload
      const result = await processCSVUpload(
        file,
        preview.headers,
        preview.sampleRows.concat(
          // Get all remaining rows from file
          await getAllDataRows()
        )
      );

      if (result.success) {
        setSuccess(
          `Successfully uploaded ${result.recordsInserted} records to your secure database table: ${result.tableName}`
        );

        if (onUploadComplete) {
          onUploadComplete({
            tableName: result.tableName,
            recordCount: result.recordsInserted,
            headers: preview.headers,
            file: file.name,
            sourceId: result.sourceId,
          });
        }
      } else {
        setErrors([result.error]);
      }
    } catch (error) {
      setErrors([`Upload failed: ${error.message}`]);
    }
  };

  const getAllDataRows = async () => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');
          const dataRows = lines
            .slice(1) // Skip header
            .map((line) => parseCSVLine(line))
            .filter((row) => row.some((cell) => cell && cell.trim()));

          resolve(dataRows);
        } catch (error) {
          console.error('Error reading all data:', error);
          resolve([]);
        }
      };

      reader.onerror = () => resolve([]);
      reader.readAsText(file);
    });
  };

  // Removed old upload functions - now using useDataUpload hook

  return (
    <div className="csv-upload">
      <div className="upload-section">
        <div className="file-input-area">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="file-input-hidden"
            id="csv-file-input"
          />

          <label htmlFor="csv-file-input" className="file-input-label">
            <div className="file-input-content">
              <div className="file-icon">📁</div>
              <div className="file-text">
                <strong>Click to select file</strong>
                <p>CSV, Excel files up to 10MB</p>
              </div>
            </div>
          </label>

          {file && (
            <div className="selected-file">
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setValidationResults(null);
                  fileInputRef.current.value = '';
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="error-banner">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        {success && <div className="success-banner">{success}</div>}
      </div>

      {preview && (
        <div className="preview-section">
          <h4>📋 Data Preview</h4>
          <div className="preview-stats">
            <span>Total rows: {preview.totalRows}</span>
            <span>Columns: {preview.headers.length}</span>
          </div>

          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  {preview.headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {validationResults && (
        <div className="validation-section">
          <h4>✅ Validation Results</h4>

          {validationResults.hasRequiredColumns ? (
            <div className="validation-success">
              <p>✅ Data looks good! Ready to upload.</p>
            </div>
          ) : (
            <div className="validation-warning">
              <p>⚠️ Some issues were found with your data:</p>
            </div>
          )}

          {validationResults.issues.length > 0 && (
            <div className="validation-issues">
              <strong>Issues:</strong>
              <ul>
                {validationResults.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResults.recommendations.length > 0 && (
            <div className="validation-recommendations">
              <strong>Recommendations:</strong>
              <ul>
                {validationResults.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(validationResults.columnMapping).length > 0 && (
            <div className="column-mapping">
              <strong>Detected columns:</strong>
              <div className="mapping-list">
                {Object.entries(validationResults.columnMapping).map(([field, column]) => (
                  <div key={field} className="mapping-item">
                    <span className="field-name">{field}:</span>
                    <span className="column-name">{column}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {file && preview && (
        <div className="upload-actions">
          {uploading && progress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="progress-text">{progress}% uploaded</span>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || !validationResults?.hasRequiredColumns}
          >
            {uploading ? 'Uploading...' : `Upload ${preview.totalRows} Records`}
          </button>
        </div>
      )}

      <div className="upload-info">
        <h4>📋 Supported Formats</h4>
        <ul>
          <li>
            <strong>CSV:</strong> Comma-separated values file
          </li>
          <li>
            <strong>Excel:</strong> .xlsx or .xls files
          </li>
        </ul>

        <h4>💡 Tips for Best Results</h4>
        <ul>
          <li>Include column headers in the first row</li>
          <li>Use common field names like: name, email, phone, amount, date</li>
          <li>Keep data clean and consistent</li>
          <li>Remove any empty rows at the end</li>
        </ul>

        <h4>🔒 Privacy & Security</h4>
        <ul>
          <li>Your data is stored in a secure, isolated table</li>
          <li>Only you and your authorized team can access it</li>
          <li>All data is encrypted in transit and at rest</li>
          <li>You can export or delete your data anytime</li>
        </ul>
      </div>
    </div>
  );
};

export default CSVUpload;
