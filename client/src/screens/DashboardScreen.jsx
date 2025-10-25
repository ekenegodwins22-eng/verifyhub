import React, { useState } from 'react';
import HomeTab from '../components/HomeTab';
import BuyTab from '../components/BuyTab';
import OrdersTab from '../components/OrdersTab';
import '../styles/DashboardScreen.css';

function DashboardScreen({ user, token, onLogout, onBalanceUpdate, apiUrl }) {
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
              apiUrl={apiUrl}
            />
          )}
          {activeTab === 'buy' && (
            <BuyTab 
              user={user} 
              token={token}
              onBalanceUpdate={onBalanceUpdate}
              onOrderCreated={() => setActiveTab('orders')}
              apiUrl={apiUrl}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersTab 
              user={user} 
              token={token}
              apiUrl={apiUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardScreen;

