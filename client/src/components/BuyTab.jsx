import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/BuyTab.css';

function BuyTab({ user, token, onBalanceUpdate, onOrderCreated }) {
  const [services, setServices] = useState([]);
  const [countries, setCountries] = useState([]);
  const [pricing, setPricing] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buying, setBuying] = useState(false);

  // Get API URL - use window.location.origin in production
  const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? window.location.origin 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

  useEffect(() => {
    console.log('BuyTab: Fetching services from', API_URL);
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_URL}/api/services`;
      console.log('BuyTab: Calling', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log('BuyTab: Response', response.data);

      if (response.data.success) {
        setServices(response.data.services || []);
        setCountries(response.data.countries || []);
        setPricing(response.data.pricing || {});
        if (response.data.services?.length > 0) {
          setSelectedService(response.data.services[0].id);
        }
        if (response.data.countries?.length > 0) {
          setSelectedCountry(response.data.countries[0].code);
        }
      } else {
        setError(response.data.error || 'Failed to load services');
      }
    } catch (err) {
      console.error('BuyTab Error:', err);
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPrice = () => {
    if (!selectedService || !selectedCountry) return null;
    return pricing[selectedService]?.[selectedCountry];
  };

  const handleBuyNumber = async () => {
    if (!selectedService || !selectedCountry) {
      setError('Please select service and country');
      return;
    }

    const price = getCurrentPrice();
    if (!price) {
      setError('Price not available');
      return;
    }

    if (user.balance < price.userPrice) {
      setError(`Insufficient balance. You need $${price.userPrice.toFixed(2)}`);
      return;
    }

    setBuying(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/orders/buy`,
        {
          service: selectedService,
          country: selectedCountry,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        onBalanceUpdate(response.data.newBalance);
        alert(`✅ Number purchased!\n\n📱 ${response.data.order.phoneNumber}\n\nCheck your orders tab for SMS code.`);
        onOrderCreated();
      } else {
        setError(response.data.error || 'Failed to buy number');
      }
    } catch (err) {
      console.error('Error buying number:', err);
      setError(err.response?.data?.error || 'Failed to buy number');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return <div className="buy-tab loading">Loading services...</div>;
  }

  if (error && services.length === 0) {
    return (
      <div className="buy-tab">
        <div className="buy-container">
          <h2>Buy SMS Number</h2>
          <div className="error-message">{error}</div>
          <button onClick={fetchServices} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();

  return (
    <div className="buy-tab">
      <div className="buy-container">
        <h2>Buy SMS Number</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <div className="form-group">
            <label>Select Service</label>
            <div className="service-grid">
              {services.map((service) => (
                <button
                  key={service.id}
                  className={`service-card ${selectedService === service.id ? 'active' : ''}`}
                  onClick={() => setSelectedService(service.id)}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Select Country</label>
            <select
              value={selectedCountry || ''}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="country-select"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {currentPrice && (
            <div className="price-summary">
              <div className="price-row">
                <span>Price:</span>
                <span className="price">${currentPrice.userPrice.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Your Balance:</span>
                <span className={user.balance >= currentPrice.userPrice ? 'balance-ok' : 'balance-low'}>
                  ${user.balance.toFixed(2)}
                </span>
              </div>
              {user.balance < currentPrice.userPrice && (
                <div className="insufficient-balance">
                  ⚠️ Insufficient balance. Need ${(currentPrice.userPrice - user.balance).toFixed(2)} more.
                </div>
              )}
            </div>
          )}

          <button
            className="buy-button"
            onClick={handleBuyNumber}
            disabled={buying || user.balance < (currentPrice?.userPrice || 0)}
          >
            {buying ? 'Processing...' : `Buy Now - $${currentPrice?.userPrice.toFixed(2) || '0.00'}`}
          </button>
        </div>

        <div className="info-section">
          <h3>📌 How it works</h3>
          <ul>
            <li>Select the service you want to verify</li>
            <li>Choose your preferred country</li>
            <li>Click "Buy Now" to get a phone number</li>
            <li>Use the number to sign up</li>
            <li>SMS code will appear automatically in your Orders</li>
            <li>Copy and paste the code to complete verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BuyTab;

