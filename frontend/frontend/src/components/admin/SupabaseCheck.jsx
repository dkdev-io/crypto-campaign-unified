import React, { useState, useEffect } from 'react';
import {
  checkSupabaseSetup,
  testCampaignCreation,
  CREATE_TABLES_SQL,
} from '../../lib/supabase-setup';

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
      setLogs((prev) => [...prev, { type: 'log', message: args.join(' ') }]);
    };

    console.error = (...args) => {
      originalError(...args);
      setLogs((prev) => [...prev, { type: 'error', message: args.join(' ') }]);
    };

    // Run check
    checkSupabaseSetup().then((result) => {
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
    <div className="space-y-6">
      <div className="crypto-card text-center">
        <h1 className="text-2xl font-bold text-foreground">🔧 Supabase Setup Check</h1>
      </div>

      <div
        className={`crypto-card ${
          status === 'connected'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}
      >
        <h2 className="text-lg font-semibold">
          Status: {status === 'connected' ? '✅ Connected' : '❌ Not Connected'}
        </h2>
      </div>

      <div className="crypto-card">
        <button onClick={runTest} className="btn-primary">
          🧪 Test Campaign Creation
        </button>
      </div>

      {testResult && (
        <div className="crypto-card bg-primary/10">
          <h3 className="text-lg font-semibold text-foreground mb-4">Test Result:</h3>
          <pre className="text-xs overflow-auto bg-secondary p-4 rounded font-mono">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="crypto-card bg-secondary max-h-96 overflow-auto">
        <h3 className="text-lg font-semibold text-foreground mb-4">📋 Logs:</h3>
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`font-mono text-xs ${
                log.type === 'error' ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {log.message}
            </div>
          ))}
        </div>
      </div>

      <div className="crypto-card bg-accent/10 border-accent/20">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          📝 If tables don't exist, run this SQL in Supabase:
        </h3>
        <details className="cursor-pointer">
          <summary className="text-accent-foreground font-medium hover:text-accent">
            Click to view SQL
          </summary>
          <pre className="bg-card p-4 rounded text-xs overflow-auto mt-4 border border-border font-mono">
            {CREATE_TABLES_SQL}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default SupabaseCheck;
