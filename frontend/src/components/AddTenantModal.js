import React, { useState, useEffect } from 'react';
import { tenantsAPI, unitsAPI } from '../services/api';

function AddTenantModal({ isOpen, onClose, onSuccess }) {
  const [units, setUnits] = useState([]);
  const [formData, setFormData] = useState({
    unit: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    id_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    move_in_date: '',
    deposit_amount: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchVacantUnits();
      // Set today's date as default move-in date
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, move_in_date: today }));
    }
  }, [isOpen]);

  const fetchVacantUnits = async () => {
    try {
      const response = await unitsAPI.getAll({ status: 'VACANT' });
      const data = response.data.results || response.data;
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await tenantsAPI.create(formData);
      onSuccess();
      onClose();
      setFormData({
        unit: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        id_number: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        move_in_date: new Date().toISOString().split('T')[0],
        deposit_amount: '',
        notes: ''
      });
    } catch (err) {
      setError('Failed to create tenant. Please check all fields.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Tenant</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Unit *</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
            >
              <option value="">Select a vacant unit</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.building_name} - Unit {unit.unit_number} (KES {unit.monthly_rent})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="e.g., 0712345678"
              />
            </div>
          </div>

          <div className="form-group">
            <label>ID Number *</label>
            <input
              type="text"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              required
              placeholder="National ID or Passport"
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>Emergency Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>Move-in Date *</label>
              <input
                type="date"
                name="move_in_date"
                value={formData.move_in_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Deposit Amount (KES) *</label>
              <input
                type="number"
                name="deposit_amount"
                value={formData.deposit_amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about the tenant"
              rows="2"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Add Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTenantModal;
