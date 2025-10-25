import React, { useState } from 'react';
import axios from 'axios';
import '../styles/HomeTab.css';

function HomeTab({ user, token, onBalanceUpdate }) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState(null);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);

    if (!amount || amount < 1) {
      setDepositError('Minimum deposit amount is $1.00');
      return;
    }

    setDepositLoading(true);
    setDepositError(null);

    try {
      const API_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
        ? window.location.origin 
        : (import.meta.env.VITE_API_URL || 'http://localhost:5000'));

      const response = await axios.post(
        `${API_URL}/api/deposit/create`,
        { amount: amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success && response.data.paymentUrl) {
        // Redirect user to NowPayments for payment
        window.location.href = response.data.paymentUrl;
      } else {
        setDepositError(response.data.error || 'Failed to initiate payment.');
      }
    } catch (error) {
      console.error('Deposit error:', error.response?.data || error.message);
      setDepositError(error.response?.data?.error || 'Deposit failed. Check console for details.');
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <div className="home-tab">
      <div className="balance-card">
        <div className="balance-label">Your Balance</div>
        <div className="balance-amount">${user.balance.toFixed(2)}</div>
        <button
          className="deposit-btn"
          onClick={() => setShowDepositModal(true)}
        >
          💳 Deposit Money
        </button>
      </div>

      <div className="welcome-section">
        <h2>Welcome, {user.firstName || user.username}! 👋</h2>
        <p>Ready to get SMS verification codes?</p>
      </div>

      <div className="quick-stats">
        <div className="stat">
          <span className="stat-icon">📱</span>
          <span className="stat-label">Services</span>
          <span className="stat-value">10+</span>
        </div>
        <div className="stat">
          <span className="stat-icon">🌍</span>
          <span className="stat-label">Countries</span>
          <span className="stat-value">150+</span>
        </div>
        <div className="stat">
          <span className="stat-icon">⚡</span>
          <span className="stat-label">Speed</span>
          <span className="stat-value">Instant</span>
        </div>
      </div>

      <div className="info-box">
        <h3>How it works</h3>
        <ol>
          <li>Deposit money to your account</li>
          <li>Select a service and country</li>
          <li>Get a phone number instantly</li>
          <li>Receive SMS code automatically</li>
          <li>Complete your verification</li>
        </ol>
      </div>

      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deposit Money</h3>
              <button
                className="close-btn"
                onClick={() => setShowDepositModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {depositError && (
                <div className="error-message">{depositError}</div>
              )}

              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="payment-methods">
                <h4>Payment Methods</h4>
                <button className="payment-method" disabled>
                  <span>USDT</span> Polygon (via NowPayments)
                </button>
                <button className="payment-method" disabled>
                  <span>USDT</span> Solana (via NowPayments)
                </button>
                <button className="payment-method" disabled>
                  <span>₿</span> Bitcoin
                </button>
                <button className="payment-method" disabled>
                  <span>Ξ</span> Ethereum
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDepositModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleDeposit}
                disabled={depositLoading}
              >
                {depositLoading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeTab;

