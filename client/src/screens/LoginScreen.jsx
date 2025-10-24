import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/LoginScreen.css';

function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('📝 LoginScreen mounted');
    // Wait a bit for Telegram WebApp to fully initialize
    setTimeout(() => {
      autoLogin();
    }, 500);
  }, []);

  const autoLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setRetrying(false);
      setDebugInfo('Starting auto-login...');

      console.log('🔐 Starting auto-login...');

      // Get Telegram WebApp instance
      const tg = window.Telegram?.WebApp;
      
      if (!tg) {
        console.error('❌ Telegram WebApp not available');
        setError('Telegram WebApp not available. Please open from Telegram.');
        setDebugInfo('Telegram WebApp SDK not found');
        setLoading(false);
        return;
      }

      console.log('✅ Telegram WebApp available');
      setDebugInfo('Telegram WebApp SDK found');

      // Initialize the WebApp
      tg.ready();
      tg.expand();

      // Get user data from Telegram
      const initData = tg.initData;
      const user = tg.initDataUnsafe?.user;
      
      console.log('📊 Init Data:', initData);
      console.log('👤 User Data:', user);
      setDebugInfo(`User ID: ${user?.id || 'Not found'}`);

      if (!user || !user.id) {
        console.error('❌ No Telegram user data available');
        console.log('📊 Full initDataUnsafe:', tg.initDataUnsafe);
        setError('Could not get Telegram user data. Please try again or refresh the page.');
        setDebugInfo('User data not available in initDataUnsafe');
        setLoading(false);
        return;
      }

      console.log('👤 Telegram user:', user);
      setDebugInfo(`Logging in user: ${user.first_name}`);

      // Detect API URL
      const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
        ? window.location.origin 
        : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

      console.log('🌐 API URL:', API_URL);
      setDebugInfo(`API URL: ${API_URL}`);

      // Send Telegram ID to backend for auto-login
      const loginUrl = `${API_URL}/api/auth/auto-login`;
      console.log('📤 Calling login endpoint:', loginUrl);
      setDebugInfo('Sending login request...');

      const response = await axios.post(loginUrl, {
        telegramId: user.id,
        username: user.username || null,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
      }, {
        timeout: 10000,
      });

      console.log('📥 Login response:', response.data);
      setDebugInfo('Login successful!');

      if (response.data.success) {
        console.log('✅ Auto-login successful');
        onLogin(response.data.token, response.data.user);
      } else {
        console.error('❌ Auto-login failed:', response.data.error);
        setError(response.data.error || 'Login failed');
        setDebugInfo(`Error: ${response.data.error}`);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Auto-login error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to login';
      setError(errorMsg);
      setDebugInfo(`Error: ${errorMsg}`);
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    autoLogin();
  };

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="logo-section">
            <div className="logo">🔐</div>
            <h1>VerifyHub</h1>
            <p className="tagline">Instant SMS Verification</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <p>Logging you in...</p>
            {debugInfo && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                {debugInfo}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="logo-section">
          <div className="logo">🔐</div>
          <h1>VerifyHub</h1>
          <p className="tagline">Instant SMS Verification</p>
        </div>

        <div className="features">
          <div className="feature">
            <span className="icon">⚡</span>
            <span>Instant SMS codes</span>
          </div>
          <div className="feature">
            <span className="icon">🌍</span>
            <span>150+ countries</span>
          </div>
          <div className="feature">
            <span className="icon">💰</span>
            <span>Affordable pricing</span>
          </div>
          <div className="feature">
            <span className="icon">🔒</span>
            <span>Secure & private</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        <button
          className="login-button"
          onClick={handleRetry}
          disabled={retrying}
        >
          {retrying ? 'Retrying...' : 'Try Again'}
        </button>

        {debugInfo && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#333',
            wordBreak: 'break-word',
          }}>
            <strong>Debug Info:</strong> {debugInfo}
          </div>
        )}

        <p className="info-text">
          We use your Telegram account to securely verify your identity. No password needed.
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;

