import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/LoginScreen.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Auto-login if Telegram WebApp is available with valid initData
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      console.log('Telegram WebApp detected, attempting auto-login');
      handleTelegramLogin(tg.initData);
    } else {
      console.log('Telegram WebApp not available or no initData');
    }
  }, []);

  const handleTelegramLogin = async (initData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting Telegram login with initData');
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        initData,
      });

      if (response.data.success) {
        console.log('Telegram login successful');
        onLogin(response.data.token, response.data.user);
      } else {
        console.error('Telegram login failed:', response.data.error);
        setError(response.data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Telegram login error:', err);
      setError(err.response?.data?.error || 'Failed to login with Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting test login');
      const response = await axios.post(`${API_URL}/api/auth/test-login`);

      if (response.data.success) {
        console.log('Test login successful');
        onLogin(response.data.token, response.data.user);
      } else {
        console.error('Test login failed:', response.data.error);
        setError(response.data.error || 'Test login failed');
      }
    } catch (err) {
      console.error('Test login error:', err);
      setError(err.response?.data?.error || 'Test login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      handleTelegramLogin(tg.initData);
    } else {
      console.warn('Telegram WebApp not available');
      setError('Telegram WebApp not available. Use Test Login instead.');
    }
  };

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

        {error && <div className="error-message">{error}</div>}

        <button
          className="login-button"
          onClick={handleLoginClick}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login with Telegram'}
        </button>

        <button
          className="login-button"
          onClick={handleTestLogin}
          disabled={loading}
          style={{
            marginTop: '12px',
            backgroundColor: '#10B981',
          }}
        >
          {loading ? 'Testing...' : 'Test Login (Development)'}
        </button>

        <p className="info-text">
          We use your Telegram account to securely verify your identity. No password needed.
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;

