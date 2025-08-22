import React, { useState } from 'react';
import { processContribution } from '../lib/smart-contract';

const TestingDashboard = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testForm, setTestForm] = useState({
    amount: '',
    walletAddress: '',
    firstName: '',
    lastName: '',
    email: '',
    acknowledgmentSigned: false
  });

  const runTest = async () => {
    if (!testForm.amount || !testForm.walletAddress || !testForm.firstName || !testForm.lastName || !testForm.email) {
      alert('Please fill in all required fields');
      return;
    }
<<<<<<< HEAD
    
    if (!testForm.acknowledgmentSigned) {
      alert('Please check the FEC compliance acknowledgment');
      return;
    }
=======
>>>>>>> ed641141884f9405daab140d322b712728df23bf

    setIsRunning(true);
    console.log('🔬 Running smart contract test with your data...');
    
    try {
<<<<<<< HEAD
      // Ensure all fields are properly passed
      const testData = {
        ...testForm,
        contributorWallet: testForm.walletAddress // Also include this field name
      };
      const result = await processContribution(testData, 'test-campaign-123');
=======
      const result = await processContribution(testForm, 'test-campaign-123');
>>>>>>> ed641141884f9405daab140d322b712728df23bf
      
      const testResult = {
        input: { ...testForm },
        output: result,
        timestamp: new Date().toLocaleTimeString()
      };
      
      console.log(result.success ? '✅' : '❌', 'Test result:', result);
      setTestResults(prev => [testResult, ...prev]);
      
    } catch (error) {
      console.log('❌', 'Test ERROR:', error.message);
      
      const testResult = {
        input: { ...testForm },
        output: { success: false, error: error.message },
        timestamp: new Date().toLocaleTimeString()
      };
      
      setTestResults(prev => [testResult, ...prev]);
    }
    
    setIsRunning(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#2a2a72' }}>🧪 Smart Contract Testing Dashboard</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Test contribution limits without triggering wallet extensions
        </p>
        <div style={{
          background: '#e3f2fd',
          padding: '1rem',
          borderRadius: '8px',
          margin: '1rem 0',
          border: '1px solid #bbdefb'
        }}>
          <strong>Testing Mode Active:</strong> No wallet extensions will be triggered. All transactions are simulated.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Test Input Form */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Smart Contract Test</h2>
          <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h3>Smart Contract Requirements:</h3>
            <ul>
              <li><strong>FEC Individual Limit:</strong> $3,300 per election (cumulative)</li>
              <li><strong>Minimum:</strong> $1</li>
              <li><strong>Complete Info:</strong> All fields required</li>
              <li><strong>Compliance:</strong> FEC acknowledgment checkbox must be signed</li>
              <li><strong>KYC:</strong> Requirements (to be added later)</li>
            </ul>
          </div>
          
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Contribution Amount *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={testForm.amount}
                onChange={(e) => setTestForm({...testForm, amount: e.target.value})}
                placeholder="Enter amount to test"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Wallet Address *
              </label>
              <input
                type="text"
                value={testForm.walletAddress}
                onChange={(e) => setTestForm({...testForm, walletAddress: e.target.value})}
                placeholder="Enter wallet address"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={testForm.firstName}
                  onChange={(e) => setTestForm({...testForm, firstName: e.target.value})}
                  placeholder="First name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={testForm.lastName}
                  onChange={(e) => setTestForm({...testForm, lastName: e.target.value})}
                  placeholder="Last name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Email *
              </label>
              <input
                type="email"
                value={testForm.email}
                onChange={(e) => setTestForm({...testForm, email: e.target.value})}
                placeholder="Email address"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
          
          <div style={{
            background: '#f0f8ff',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={testForm.acknowledgmentSigned}
                onChange={(e) => setTestForm({...testForm, acknowledgmentSigned: e.target.checked})}
                style={{ marginTop: '0.25rem' }}
              />
              <span>
                I certify that I am a U.S. citizen or lawfully admitted permanent resident, 
                this contribution is made from my own funds, I am not a federal contractor, 
                and I am at least 18 years old.
              </span>
            </label>
          </div>
          
          <button
            onClick={runTest}
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '1rem',
              background: isRunning ? '#ccc' : '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunning ? '⏳ Testing Smart Contract...' : '🧪 Test Smart Contract Limits'}
          </button>
        </div>

        {/* Test Results */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Test Results</h2>
          <div style={{ display: 'grid', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
            {testResults.length === 0 ? (
              <div style={{
                background: '#f8f9fa',
                padding: '2rem',
                textAlign: 'center',
                borderRadius: '8px',
                color: '#666'
              }}>
                No tests run yet. Fill in the form and click "Test Smart Contract Limits" to test your data.
              </div>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    background: result.output.success ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${result.output.success ? '#c3e6cb' : '#f5c6cb'}`,
                    padding: '1rem',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <strong>{result.output.success ? '✅ SUCCESS' : '❌ FAILED'}</strong>
                    <small>{result.timestamp}</small>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div><strong>Amount Tested:</strong> ${result.input.amount}</div>
                    <div><strong>Name:</strong> {result.input.firstName} {result.input.lastName}</div>
                    <div><strong>Email:</strong> {result.input.email}</div>
                    <div><strong>Wallet:</strong> {result.input.walletAddress?.substring(0, 20)}...</div>
                    {result.output.success ? (
                      <div style={{ color: '#155724', marginTop: '0.5rem' }}>
                        <div>✅ Transaction Hash: {result.output.transactionHash?.substring(0, 20)}...</div>
                        <div>Block: {result.output.blockNumber}</div>
                        <div>Gas Used: {result.output.gasUsed}</div>
                      </div>
                    ) : (
                      <div style={{ color: '#721c24', marginTop: '0.5rem' }}>
                        ❌ Error: {result.output.error}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingDashboard;