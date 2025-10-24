import React, { useState } from 'react';
import axios from 'axios';
import '../styles/HomeTab.css';

function HomeTab({ user, token, onBalanceUpdate, apiUrl }) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState(null);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError('Please enter a valid amount');
      return;
    }

    setDepositLoading(true);
    setDepositError(null);

    try {
      // In production, integrate with payment gateway (NowPayments, etc.)
      // For now, we'll show a placeholder
      alert('Payment gateway integration coming soon!\n\nIn production, this would redirect to NowPayments or similar.');
      setShowDepositModal(false);
      setDepositAmount('');
    } catch (error) {
      setDepositError('Deposit failed');
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
                <button className="payment-method">
                  <span>💳</span> Credit Card
                </button>
                <button className="payment-method">
                  <span>₿</span> Bitcoin
                </button>
                <button className="payment-method">
                  <span>Ξ</span> Ethereum
                </button>
                <button className="payment-method">
                  <span>💎</span> TON (Telegram)
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

