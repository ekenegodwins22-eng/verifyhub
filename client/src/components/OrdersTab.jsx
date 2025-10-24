import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/OrdersTab.css';

function OrdersTab({ user, token, apiUrl }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingOrders, setPollingOrders] = useState(new Set());

  useEffect(() => {
    console.log('OrdersTab mounted, API URL:', apiUrl);
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Auto-poll for SMS codes
  useEffect(() => {
    orders.forEach((order) => {
      if (order.status === 'waiting_sms' && !pollingOrders.has(order.id)) {
        pollForSMS(order.id);
      }
    });
  }, [orders, pollingOrders]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders from:', `${apiUrl}/api/orders`);
      const response = await axios.get(`${apiUrl}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log('Orders response:', response.data);

      if (response.data.success) {
        setOrders(response.data.orders);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const pollForSMS = async (orderId) => {
    setPollingOrders((prev) => new Set(prev).add(orderId));

    try {
      const response = await axios.get(`${apiUrl}/api/orders/${orderId}/sms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.data.success && response.data.code) {
        // SMS received, update orders
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, smsCode: response.data.code, status: 'received' }
              : order
          )
        );
        setPollingOrders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      } else if (response.data.status === 'expired') {
        // Order expired
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: 'expired' } : order
          )
        );
        setPollingOrders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
      // If still waiting, polling will continue
    } catch (err) {
      console.error('Error polling SMS:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard! ✅');
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return <div className="orders-tab loading">Loading orders...</div>;
  }

  return (
    <div className="orders-tab">
      <div className="orders-container">
        <h2>Your Orders</h2>

        {error && <div className="error-message">{error}</div>}

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>📭 No orders yet</p>
            <p>Go to the Buy tab to get started!</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className={`order-card status-${order.status}`}>
                <div className="order-header">
                  <div className="order-info">
                    <h3>{order.service.toUpperCase()}</h3>
                    <p className="country">{order.country}</p>
                  </div>
                  <div className={`status-badge status-${order.status}`}>
                    {order.status === 'waiting_sms' && '⏳ Waiting'}
                    {order.status === 'received' && '✅ Received'}
                    {order.status === 'expired' && '❌ Expired'}
                    {order.status === 'cancelled' && '🚫 Cancelled'}
                  </div>
                </div>

                <div className="order-body">
                  <div className="order-field">
                    <label>Phone Number</label>
                    <div className="phone-display">
                      <span>{order.phoneNumber}</span>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(order.phoneNumber)}
                        title="Copy phone number"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  {order.smsCode && (
                    <div className="order-field">
                      <label>SMS Code</label>
                      <div className="code-display">
                        <span className="code">{order.smsCode}</span>
                        <button
                          className="copy-btn"
                          onClick={() => copyToClipboard(order.smsCode)}
                          title="Copy SMS code"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  {order.status === 'waiting_sms' && (
                    <div className="waiting-indicator">
                      <span className="spinner"></span>
                      Waiting for SMS code...
                    </div>
                  )}

                  <div className="order-meta">
                    <span className="price">${order.userPrice.toFixed(2)}</span>
                    <span className="time">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersTab;

