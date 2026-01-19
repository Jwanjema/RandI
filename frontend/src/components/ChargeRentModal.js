import React, { useState, useEffect } from 'react';
import { paymentsAPI, tenantsAPI } from '../services/api';

const ChargeRentModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchTenants();
    // Set current month as default
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    setSelectedMonth(monthYear);
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await tenantsAPI.getAll();
      const data = response.data.results || response.data;
      // Filter only active tenants
      const activeTenants = data.filter(t => !t.move_out_date);
      setTenants(activeTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await paymentsAPI.chargeAllRent({ month: selectedMonth });
      setResult(response.data);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Error charging rent:', error);
      alert('Failed to charge rent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // Current month and next 2 months
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push(monthYear);
    }
    
    // Previous 3 months
    for (let i = 1; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.unshift(monthYear);
    }
    
    return options;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Charge Monthly Rent</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                required
              >
                {getMonthOptions().map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="tenant-preview">
              <h3>Active Tenants ({tenants.length})</h3>
              <div className="tenant-list">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="tenant-item">
                    <span>{tenant.full_name}</span>
                    <span className="unit-info">
                      {tenant.unit_details?.unit_number} - KES {tenant.unit_details?.monthly_rent}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Processing...' : 'Charge Rent'}
              </button>
            </div>
          </form>
        ) : (
          <div className="result-summary">
            <div className={`result-icon ${result.success ? 'success' : 'error'}`}>
              {result.success ? '✓' : '✗'}
            </div>
            <h3>Rent Charging Complete</h3>
            <div className="result-stats">
              <div className="stat-card">
                <div className="stat-value">{result.charged}</div>
                <div className="stat-label">Tenants Charged</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{result.skipped}</div>
                <div className="stat-label">Already Charged</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">KES {result.total_amount?.toLocaleString()}</div>
                <div className="stat-label">Total Amount</div>
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="errors">
                <h4>Errors:</h4>
                {result.errors.map((error, idx) => (
                  <p key={idx} className="error-message">{error}</p>
                ))}
              </div>
            )}
            <button className="primary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .tenant-preview {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .tenant-preview h3 {
          margin: 0 0 15px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tenant-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tenant-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }

        .unit-info {
          color: #2196F3;
          font-weight: 500;
          font-size: 14px;
        }

        .result-summary {
          text-align: center;
          padding: 20px;
        }

        .result-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 48px;
          font-weight: bold;
        }

        .result-icon.success {
          background: #4CAF50;
          color: white;
        }

        .result-icon.error {
          background: #f44336;
          color: white;
        }

        .result-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 30px 0;
        }

        .stat-card {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #2196F3;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .errors {
          margin: 20px 0;
          padding: 15px;
          background: #fff3cd;
          border-radius: 8px;
          text-align: left;
        }

        .errors h4 {
          margin: 0 0 10px 0;
          color: #856404;
        }

        .error-message {
          margin: 5px 0;
          color: #856404;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default ChargeRentModal;
