import React, { useState } from 'react';
import HomeTab from '../components/HomeTab';
import BuyTab from '../components/BuyTab';
import OrdersTab from '../components/OrdersTab';
import '../styles/DashboardScreen.css';

// Get API URL
const getAPIUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

const API_URL = getAPIUrl();

function DashboardScreen({ user, token, onLogout, onBalanceUpdate }) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>VerifyHub</h1>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="tabs-container">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="icon">🏠</span>
            Home
          </button>
          <button
            className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            <span className="icon">🛒</span>
            Buy
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span className="icon">📋</span>
            Orders
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'home' && (
            <HomeTab 
              user={user} 
              token={token}
              onBalanceUpdate={onBalanceUpdate}
              apiUrl={API_URL}
            />
          )}
          {activeTab === 'buy' && (
            <BuyTab 
              user={user} 
              token={token}
              onBalanceUpdate={onBalanceUpdate}
              onOrderCreated={() => setActiveTab('orders')}
              apiUrl={API_URL}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersTab 
              user={user} 
              token={token}
              apiUrl={API_URL}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardScreen;

