import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import './App.css';

// Detect API URL based on environment
const getAPIUrl = () => {
  // In production, use the same domain as the app
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  // In development, use environment variable or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

const API_URL = getAPIUrl();

console.log('API URL:', API_URL);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [error, setError] = useState(null);

  // Initialize Telegram WebApp
  useEffect(() => {
    console.log('Initializing Telegram WebApp...');
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Set color scheme
      tg.setHeaderColor('#2563EB');
      tg.setBackgroundColor('#ffffff');
      
      console.log('Telegram WebApp initialized');
      console.log('User data:', tg.initDataUnsafe?.user);
    } else {
      console.warn('Telegram WebApp not available');
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    console.log('Checking authentication, token:', !!token);
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      console.log('Verifying token...');
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        console.log('Token verified, user:', response.data.user);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        console.warn('Token verification failed');
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newToken, userData) => {
    console.log('Login successful, user:', userData);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="spinner"></div>
        <p>Loading VerifyHub...</p>
        {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <DashboardScreen 
          user={user} 
          token={token} 
          onLogout={handleLogout}
          onBalanceUpdate={(newBalance) => setUser({ ...user, balance: newBalance })}
        />
      ) : (
        <LoginScreen onLogin={handleLogin} apiUrl={API_URL} />
      )}
    </div>
  );
}

export default App;

