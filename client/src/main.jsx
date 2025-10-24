import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 VerifyHub starting...');
console.log('Environment:', import.meta.env.MODE);
console.log('API URL:', import.meta.env.VITE_API_URL);

// Check if Telegram WebApp is available
if (window.Telegram?.WebApp) {
  console.log('✅ Telegram WebApp SDK loaded');
} else {
  console.warn('⚠️ Telegram WebApp SDK not available');
}

// Render the app
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ React app mounted');
} else {
  console.error('❌ Root element not found');
}

