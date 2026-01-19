import React, { useState } from 'react';
import { buildingsAPI } from '../services/api';


function AddBuildingModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    total_units: '',
    description: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      if (image) data.append('photo', image);
      await buildingsAPI.create(data);
      onSuccess();
      onClose();
      setFormData({ name: '', address: '', total_units: '', description: '' });
      setImage(null);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 
                       err.response?.data?.message || 
                       JSON.stringify(err.response?.data) ||
                       'Failed to create building. Please try again.';
      setError(errorMsg);
      console.error('Error creating building:', err);
      console.error('Error response:', err.response);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Building</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Building Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Sunset Apartments"
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="e.g., 123 Westlands Road, Nairobi"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Total Units *</label>
            <input
              type="number"
              name="total_units"
              value={formData.total_units}
              onChange={handleChange}
              required
              min="1"
              placeholder="e.g., 12"
            />
          </div>


          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional information about the building"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Building Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {image && (
              <div style={{ marginTop: '0.5rem' }}>
                <img src={URL.createObjectURL(image)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBuildingModal;
