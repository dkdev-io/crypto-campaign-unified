import React, { useState, useEffect } from 'react';
import { checkSupabaseSetup, testCampaignCreation, CREATE_TABLES_SQL } from '../../lib/supabase-setup';

const SupabaseCheck = () => {
  const [status, setStatus] = useState('checking');
  const [logs, setLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, { type: 'log', message: args.join(' ') }]);
    };
    
    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [...prev, { type: 'error', message: args.join(' ') }]);
    };
    
    // Run check
    checkSupabaseSetup().then(result => {
      setStatus(result ? 'connected' : 'error');
    });
    
    // Restore console
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const runTest = async () => {
    setLogs([]);
    const result = await testCampaignCreation();
    setTestResult(result);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔧 Supabase Setup Check</h1>
      
      <div style={{ 
        background: status === 'connected' ? '#d4edda' : '#f8d7da',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2>Status: {status === 'connected' ? '✅ Connected' : '❌ Not Connected'}</h2>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={runTest}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🧪 Test Campaign Creation
        </button>
      </div>

      {testResult && (
        <div style={{
          background: '#e7f3ff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3>Test Result:</h3>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div style={{
        background: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <h3>📋 Logs:</h3>
        {logs.map((log, i) => (
          <div 
            key={i}
            style={{ 
              color: log.type === 'error' ? 'red' : 'black',
              fontFamily: 'monospace',
              fontSize: '12px',
              marginBottom: '0.5rem'
            }}
          >
            {log.message}
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff3cd',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <h3>📝 If tables don't exist, run this SQL in Supabase:</h3>
        <details>
          <summary>Click to view SQL</summary>
          <pre style={{ 
            background: 'white',
            padding: '1rem',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {CREATE_TABLES_SQL}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default SupabaseCheck;