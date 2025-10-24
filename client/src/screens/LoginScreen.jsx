import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/LoginScreen.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Auto-login on component mount
    autoLogin();
  }, []);

  const autoLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get Telegram WebApp instance
      const tg = window.Telegram?.WebApp;
      
      if (!tg) {
        console.error('Telegram WebApp not available');
        setError('Please open this app from Telegram');
        setLoading(false);
        return;
      }

      // Get user data from Telegram
      const user = tg.initDataUnsafe?.user;
      
      if (!user || !user.id) {
        console.error('No Telegram user data available');
        setError('Could not get Telegram user data');
        setLoading(false);
        return;
      }

      console.log('Telegram user:', user);

      // Send Telegram ID to backend for auto-login
      const response = await axios.post(`${API_URL}/api/auth/auto-login`, {
        telegramId: user.id,
        username: user.username || null,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
      });

      if (response.data.success) {
        console.log('Auto-login successful');
        onLogin(response.data.token, response.data.user);
      } else {
        console.error('Auto-login failed:', response.data.error);
        setError(response.data.error || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Auto-login error:', err);
      setError(err.response?.data?.error || 'Failed to login');
      setLoading(false);
    }
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

        {error && <div className="error-message">{error}</div>}

        <button
          className="login-button"
          onClick={autoLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Try Again'}
        </button>

        <p className="info-text">
          We use your Telegram account to securely verify your identity. No password needed.
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;

