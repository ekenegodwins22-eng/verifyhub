import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/LoginScreen.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Auto-login if Telegram WebApp is available
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      handleTelegramLogin(tg.initData);
    }
  }, []);

  const handleTelegramLogin = async (initData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        initData,
      });

      if (response.data.success) {
        onLogin(response.data.token, response.data.user);
      } else {
        setError(response.data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      handleTelegramLogin(tg.initData);
    } else {
      setError('Telegram WebApp not available');
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

        <p className="info-text">
          We use your Telegram account to securely verify your identity. No password needed.
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;

