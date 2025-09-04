import React from 'react';
import { useLocation } from 'react-router-dom';

const TestBypass = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const bypassParam = searchParams.get('bypass');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Test Bypass Page</h1>
        <div className="space-y-2">
          <p><strong>Current URL:</strong> {location.pathname + location.search}</p>
          <p><strong>Bypass Parameter:</strong> {bypassParam || 'None'}</p>
          <p><strong>Is Dev:</strong> {String(import.meta.env.DEV)}</p>
          <p><strong>Hostname:</strong> {window.location.hostname}</p>
        </div>
        
        {bypassParam === 'true' && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
            ✅ Bypass parameter detected successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default TestBypass;