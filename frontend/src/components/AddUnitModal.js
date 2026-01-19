import React, { useState, useEffect } from 'react';
import { unitsAPI, buildingsAPI } from '../services/api';

function AddUnitModal({ isOpen, onClose, onSuccess, buildingId = null }) {
  const [buildings, setBuildings] = useState([]);
  const [formData, setFormData] = useState({
    building: buildingId || '',
    unit_number: '',
    monthly_rent: '',
    bedrooms: '1',
    bathrooms: '1',
    square_feet: '',
    status: 'VACANT',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBuildings();
    }
  }, [isOpen]);

  const fetchBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      const data = response.data.results || response.data;
      setBuildings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching buildings:', err);
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
      // Prepare data, converting empty strings to null for optional numeric fields
      const submitData = {
        ...formData,
        square_feet: formData.square_feet === '' ? null : formData.square_feet,
      };
      
      await unitsAPI.create(submitData);
      onSuccess();
      onClose();
      setFormData({
        building: buildingId || '',
        unit_number: '',
        monthly_rent: '',
        bedrooms: '1',
        bathrooms: '1',
        square_feet: '',
        status: 'VACANT',
        description: ''
      });
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 
                       err.response?.data?.unit_number?.[0] ||
                       err.response?.data?.monthly_rent?.[0] ||
                       err.response?.data?.square_feet?.[0] ||
                       JSON.stringify(err.response?.data) ||
                       'Failed to create unit. Please try again.';
      setError(errorMsg);
      console.error('Error creating unit:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Unit</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Building *</label>
            <select
              name="building"
              value={formData.building}
              onChange={handleChange}
              required
            >
              <option value="">Select a building</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Unit Number *</label>
            <input
              type="text"
              name="unit_number"
              value={formData.unit_number}
              onChange={handleChange}
              required
              placeholder="e.g., A1, 101, etc."
            />
          </div>

          <div className="form-group">
            <label>Monthly Rent (KES) *</label>
            <input
              type="number"
              name="monthly_rent"
              value={formData.monthly_rent}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="e.g., 25000"
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>Bedrooms</label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Square Feet</label>
            <input
              type="number"
              name="square_feet"
              value={formData.square_feet}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 850"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="VACANT">Vacant</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Under Maintenance</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional information about the unit"
              rows="2"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUnitModal;
