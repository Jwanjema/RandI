import React, { useState, useEffect } from 'react';
import { utilitiesAPI, buildingsAPI, unitsAPI } from '../services/api';

function Utilities() {
  const [utilities, setUtilities] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [units, setUnits] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ type: 'ALL', status: 'ALL' });
  const [newUtility, setNewUtility] = useState({
    utility_type: 'WATER',
    building: '',
    unit: '',
    billing_date: new Date().toISOString().split('T')[0],
    amount: '',
    previous_reading: '',
    current_reading: '',
    status: 'PENDING',
    notes: ''
  });

  const utilityTypes = [
    { value: 'WATER', label: '💧 Water', color: '#3498db' },
    { value: 'ELECTRICITY', label: '⚡ Electricity', color: '#f39c12' },
    { value: 'INTERNET', label: '🌐 Internet', color: '#9b59b6' },
    { value: 'GAS', label: '🔥 Gas', color: '#e74c3c' },
    { value: 'GARBAGE', label: '🗑️ Garbage', color: '#95a5a6' },
    { value: 'OTHER', label: '📋 Other', color: '#34495e' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [utilitiesRes, buildingsRes, unitsRes, summaryRes] = await Promise.all([
        utilitiesAPI.getAll(),
        buildingsAPI.getAll(),
        unitsAPI.getAll(),
        utilitiesAPI.getSummary()
      ]);
      setUtilities(utilitiesRes.data.results || utilitiesRes.data);
      setBuildings(buildingsRes.data.results || buildingsRes.data);
      setUnits(unitsRes.data.results || unitsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await utilitiesAPI.create(newUtility);
      fetchData();
      setShowModal(false);
      setNewUtility({
        utility_type: 'WATER',
        building: '',
        unit: '',
        billing_date: new Date().toISOString().split('T')[0],
        amount: '',
        previous_reading: '',
        current_reading: '',
        status: 'PENDING',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating utility:', error);
      alert('Failed to create utility bill');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const utility = utilities.find(u => u.id === id);
      await utilitiesAPI.update(id, { ...utility, status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this utility bill?')) {
      try {
        await utilitiesAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting utility:', error);
      }
    }
  };

  const getTypeInfo = (type) => {
    return utilityTypes.find(t => t.value === type) || utilityTypes[5];
  };

  const filteredUtilities = utilities.filter(util => {
    if (filter.type !== 'ALL' && util.utility_type !== filter.type) return false;
    if (filter.status !== 'ALL' && util.status !== filter.status) return false;
    return true;
  });

  if (loading) return <div className="container"><div className="loading">Loading...</div></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>⚡ Utilities & Services</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Utility Bill
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {summary.map(item => {
          const typeInfo = getTypeInfo(item.utility_type);
          return (
            <div key={item.utility_type} className="stat-card" style={{ borderLeft: `4px solid ${typeInfo.color}` }}>
              <div className="stat-label">{typeInfo.label}</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                KES {(item.total_amount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <span style={{ color: '#27ae60' }}>Paid: KES {(item.paid_amount || 0).toLocaleString()}</span>
                <br />
                <span style={{ color: '#e74c3c' }}>Pending: KES {(item.pending_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: '500' }}>Filter:</label>
          <select 
            value={filter.type} 
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="ALL">All Types</option>
            {utilityTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select 
            value={filter.status} 
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Utilities Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Building</th>
              <th>Unit</th>
              <th>Billing Date</th>
              <th>Amount</th>
              <th>Reading</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUtilities.map(util => {
              const typeInfo = getTypeInfo(util.utility_type);
              return (
                <tr key={util.id}>
                  <td>
                    <span style={{ 
                      backgroundColor: typeInfo.color, 
                      color: 'white', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px',
                      fontSize: '0.85rem'
                    }}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td>{util.building_name || 'N/A'}</td>
                  <td>{util.unit_number || 'N/A'}</td>
                  <td>{new Date(util.billing_date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold' }}>KES {parseFloat(util.amount).toLocaleString()}</td>
                  <td>
                    {util.previous_reading && util.current_reading ? 
                      `${util.previous_reading} → ${util.current_reading}` : 'N/A'}
                  </td>
                  <td>
                    <select
                      value={util.status}
                      onChange={(e) => handleStatusUpdate(util.id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        backgroundColor: util.status === 'PAID' ? '#d4edda' : '#fff3cd',
                        color: util.status === 'PAID' ? '#155724' : '#856404',
                        fontWeight: '500'
                      }}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </td>
                  <td>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => handleDelete(util.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUtilities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            No utility bills found
          </div>
        )}
      </div>

      {/* Add Utility Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Utility Bill</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Utility Type *</label>
                <select
                  value={newUtility.utility_type}
                  onChange={(e) => setNewUtility({ ...newUtility, utility_type: e.target.value })}
                  required
                >
                  {utilityTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Building</label>
                  <select
                    value={newUtility.building}
                    onChange={(e) => setNewUtility({ ...newUtility, building: e.target.value })}
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
                    value={newUtility.unit}
                    onChange={(e) => setNewUtility({ ...newUtility, unit: e.target.value })}
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
                <label>Billing Date *</label>
                <input
                  type="date"
                  value={newUtility.billing_date}
                  onChange={(e) => setNewUtility({ ...newUtility, billing_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount (KES) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newUtility.amount}
                  onChange={(e) => setNewUtility({ ...newUtility, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Previous Reading</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newUtility.previous_reading}
                    onChange={(e) => setNewUtility({ ...newUtility, previous_reading: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Current Reading</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newUtility.current_reading}
                    onChange={(e) => setNewUtility({ ...newUtility, current_reading: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={newUtility.status}
                  onChange={(e) => setNewUtility({ ...newUtility, status: e.target.value })}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newUtility.notes}
                  onChange={(e) => setNewUtility({ ...newUtility, notes: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Utility Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Utilities;
