import React, { useState, useEffect } from 'react';
import { photosAPI, buildingsAPI, unitsAPI } from '../services/api';
import { API_URL } from '../config';
import { API_URL } from '../config';

function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ building: '', unit: '', type: 'ALL' });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [newPhoto, setNewPhoto] = useState({
    building: '',
    unit: '',
    photo_type: 'EXTERIOR',
    caption: '',
    is_primary: false,
    display_order: 0
  });

  const photoTypes = [
    { value: 'EXTERIOR', label: '🏠 Exterior', color: '#3498db' },
    { value: 'INTERIOR', label: '🛋️ Interior', color: '#2ecc71' },
    { value: 'AMENITY', label: '🏊 Amenity', color: '#9b59b6' },
    { value: 'UNIT', label: '🚪 Unit', color: '#e74c3c' },
    { value: 'COMMON_AREA', label: '🏢 Common Area', color: '#f39c12' },
    { value: 'OTHER', label: '📷 Other', color: '#95a5a6' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [photosRes, buildingsRes, unitsRes] = await Promise.all([
        photosAPI.getAll(),
        buildingsAPI.getAll(),
        unitsAPI.getAll()
      ]);
      setPhotos(photosRes.data.results || photosRes.data);
      setBuildings(buildingsRes.data.results || buildingsRes.data);
      setUnits(unitsRes.data.results || unitsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setNewPhoto({ ...newPhoto, photo: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (newPhoto.building) formData.append('building', newPhoto.building);
      if (newPhoto.unit) formData.append('unit', newPhoto.unit);
      formData.append('photo_type', newPhoto.photo_type);
      if (newPhoto.caption) formData.append('caption', newPhoto.caption);
      formData.append('is_primary', newPhoto.is_primary);
      formData.append('display_order', newPhoto.display_order);
      if (newPhoto.photo) formData.append('photo', newPhoto.photo);

      await photosAPI.create(formData);
      fetchData();
      setShowModal(false);
      setNewPhoto({
        building: '',
        unit: '',
        photo_type: 'EXTERIOR',
        caption: '',
        is_primary: false,
        display_order: 0
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await photosAPI.delete(id);
        fetchData();
        if (selectedPhoto?.id === id) setSelectedPhoto(null);
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const getTypeInfo = (type) => {
    return photoTypes.find(t => t.value === type) || photoTypes[5];
  };

  const filteredPhotos = photos.filter(photo => {
    if (filter.building && photo.building !== parseInt(filter.building)) return false;
    if (filter.unit && photo.unit !== parseInt(filter.unit)) return false;
    if (filter.type !== 'ALL' && photo.photo_type !== filter.type) return false;
    return true;
  });

  if (loading) return <div className="container"><div className="loading">Loading...</div></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>📷 Property Gallery</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Upload Photo
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: '500' }}>Filter:</label>
          <select 
            value={filter.building} 
            onChange={(e) => setFilter({ ...filter, building: e.target.value })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Buildings</option>
            {buildings.map(building => (
              <option key={building.id} value={building.id}>{building.name}</option>
            ))}
          </select>
          <select 
            value={filter.unit} 
            onChange={(e) => setFilter({ ...filter, unit: e.target.value })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Units</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.unit_number} - {unit.building_name}</option>
            ))}
          </select>
          <select 
            value={filter.type} 
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="ALL">All Types</option>
            {photoTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#7f8c8d' }}>
          <h2 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📷</h2>
          <p>No photos found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredPhotos.map(photo => {
            const typeInfo = getTypeInfo(photo.photo_type);
            return (
              <div 
                key={photo.id} 
                className="card" 
                style={{ padding: '0', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div style={{ position: 'relative', paddingBottom: '75%', backgroundColor: '#f0f0f0' }}>
                  <img 
                    src={`${API_URL.replace('/api', '')}${photo.photo}`}
                    alt={photo.caption || 'Property photo'}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:3rem;">📷</div>';
                    }}
                  />
                  {photo.is_primary && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      ⭐ PRIMARY
                    </div>
                  )}
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{
                      backgroundColor: typeInfo.color,
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem'
                    }}>
                      {typeInfo.label}
                    </span>
                  </div>
                  {photo.caption && (
                    <p style={{ margin: '0.5rem 0', fontWeight: '500' }}>{photo.caption}</p>
                  )}
                  <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                    {photo.building_name && <div>🏢 {photo.building_name}</div>}
                    {photo.unit_number && <div>🚪 Unit {photo.unit_number}</div>}
                    <div>📅 {new Date(photo.uploaded_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Size Photo Modal */}
      {selectedPhoto && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedPhoto(null)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        >
          <div 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90vh', 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={`${API_URL.replace('/api', '')}${selectedPhoto.photo}`}
              alt={selectedPhoto.caption || 'Property photo'}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            <div style={{ 
              backgroundColor: 'white', 
              padding: '1rem', 
              borderRadius: '0 0 8px 8px',
              marginTop: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>
                    {selectedPhoto.caption || 'Property Photo'}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                    {selectedPhoto.building_name && <div>Building: {selectedPhoto.building_name}</div>}
                    {selectedPhoto.unit_number && <div>Unit: {selectedPhoto.unit_number}</div>}
                    <div>Type: {getTypeInfo(selectedPhoto.photo_type).label}</div>
                    <div>Uploaded: {new Date(selectedPhoto.uploaded_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    Close
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(selectedPhoto.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Property Photo</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Photo Type *</label>
                <select
                  value={newPhoto.photo_type}
                  onChange={(e) => setNewPhoto({ ...newPhoto, photo_type: e.target.value })}
                  required
                >
                  {photoTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Building</label>
                  <select
                    value={newPhoto.building}
                    onChange={(e) => setNewPhoto({ ...newPhoto, building: e.target.value })}
                  >
                    <option value="">-- Select Building --</option>
                    {buildings.map(building => (
                      <option key={building.id} value={building.id}>{building.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={newPhoto.unit}
                    onChange={(e) => setNewPhoto({ ...newPhoto, unit: e.target.value })}
                  >
                    <option value="">-- Select Unit --</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number} - {unit.building_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Caption</label>
                <input
                  type="text"
                  value={newPhoto.caption}
                  onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                  placeholder="Add a description..."
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={newPhoto.display_order}
                    onChange={(e) => setNewPhoto({ ...newPhoto, display_order: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newPhoto.is_primary}
                      onChange={(e) => setNewPhoto({ ...newPhoto, is_primary: e.target.checked })}
                    />
                    Set as Primary Photo
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
