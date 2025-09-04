import React from 'react';

const TestDonorRoute = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontSize: '24px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🧪 TEST DONOR ROUTE</h1>
        <p>This route is working correctly!</p>
        <p>URL: {window.location.pathname}</p>
      </div>
    </div>
  );
};

export default TestDonorRoute;