// Simple check if devbypass button should appear
const isDev = process.env.NODE_ENV === 'development';
const hostname = 'localhost'; // simulating localhost

console.log('Environment check:');
console.log('- isDev (NODE_ENV):', isDev);
console.log('- hostname:', hostname);

const shouldShow = isDev || hostname === 'localhost' || hostname.includes('netlify.app');
console.log('- Should show devbypass button:', shouldShow);

// Check the actual condition from the component
const condition = true || hostname === 'localhost' || hostname.includes('netlify.app'); // import.meta.env.DEV would be true in dev
console.log('- Component condition result:', condition);