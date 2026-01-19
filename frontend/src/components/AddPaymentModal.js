import React, { useState, useEffect } from 'react';
import { paymentsAPI, tenantsAPI } from '../services/api';

function AddPaymentModal({ isOpen, onClose, onSuccess }) {
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    tenant: '',
    payment_type: 'PAYMENT',
    amount: '',
    payment_method: 'MPESA',
    transaction_date: '',
    description: '',
    reference_number: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTenants();
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, transaction_date: today }));
    }
  }, [isOpen]);

  const fetchTenants = async () => {
    try {
      const response = await tenantsAPI.getAll({ active: 'true' });
      const data = response.data.results || response.data;
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If tenant is selected and it's a payment, auto-fill description
    if (name === 'tenant' && formData.payment_type === 'PAYMENT') {
      const tenant = tenants.find(t => t.id === parseInt(value));
      if (tenant) {
        const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        setFormData(prev => ({
          ...prev,
          tenant: value,
          description: `Rent payment for ${month}`
        }));
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await paymentsAPI.create(formData);
      onSuccess();
      onClose();
      setFormData({
        tenant: '',
        payment_type: 'PAYMENT',
        amount: '',
        payment_method: 'MPESA',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        reference_number: '',
        notes: ''
      });
    } catch (err) {
      setError('Failed to record transaction. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Record Transaction</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tenant *</label>
            <select
              name="tenant"
              value={formData.tenant}
              onChange={handleChange}
              required
            >
              <option value="">Select a tenant</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.full_name} - {tenant.building_name} Unit {tenant.unit_number}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Transaction Type *</label>
            <select
              name="payment_type"
              value={formData.payment_type}
              onChange={handleChange}
              required
            >
              <option value="PAYMENT">Payment (Money Received)</option>
              <option value="CHARGE">Charge (Rent Due, Fees, etc.)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount (KES) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="e.g., 25000"
            />
          </div>

          {formData.payment_type === 'PAYMENT' && (
            <div className="form-group">
              <label>Payment Method *</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                <option value="MPESA">M-Pesa</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Transaction Date *</label>
            <input
              type="date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="e.g., Rent payment for January 2026"
            />
          </div>

          {formData.payment_type === 'PAYMENT' && (
            <div className="form-group">
              <label>Reference Number</label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                placeholder="M-Pesa code, cheque number, etc."
              />
            </div>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes"
              rows="2"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Recording...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPaymentModal;
