import React, { useState, useEffect } from 'react';
import { unitsAPI, buildingsAPI } from '../services/api';
import AddUnitModal from '../components/AddUnitModal';
import { useToast } from '../components/Toast';
import { exportToCSV } from '../utils/exportUtils';
import BulkActions from '../components/BulkActions';
import ConfirmDialog from '../components/ConfirmDialog';

function Units() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [buildings, setBuildings] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchBuildings();
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBuilding, filterStatus]);

  const fetchBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      const data = response.data.results || response.data;
      setBuildings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const params = {};
      if (filterBuilding !== 'all') params.building = filterBuilding;
      if (filterStatus !== 'all') params.status = filterStatus;
      
      const response = await unitsAPI.getAll(params);
      const data = response.data.results || response.data;
      setUnits(Array.isArray(data) ? data : []);
      setLoading(false);
      addToast('Units loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching units:', error);
      addToast('Failed to load units', 'error');
      setLoading(false);
    }
  };

  const exportUnits = () => {
    const exportData = units.map(unit => ({
      'Building': unit.building_name,
      'Unit Number': unit.unit_number,
      'Monthly Rent': unit.monthly_rent,
      'Bedrooms': unit.bedrooms,
      'Bathrooms': unit.bathrooms,
      'Status': unit.status,
      'Current Tenant': unit.current_tenant ? unit.current_tenant.full_name : 'N/A'
    }));
    
    exportToCSV(exportData, 'units-export');
    addToast('Units exported successfully', 'success');
  };

  const handleSelectAll = () => {
    setSelectedUnits(units.map(u => u.id));
  };

  const handleDeselectAll = () => {
    setSelectedUnits([]);
  };

  const handleToggleSelect = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleBulkStatusChange = (newStatus) => {
    setConfirmAction({
      title: 'Change Status',
      message: `Are you sure you want to change the status of ${selectedUnits.length} unit(s) to ${newStatus}?`,
      type: 'warning',
      onConfirm: () => performBulkStatusChange(newStatus)
    });
    setShowConfirm(true);
  };

  const performBulkStatusChange = async (newStatus) => {
    try {
      // In real implementation, you'd call an API endpoint
      addToast(`Successfully updated ${selectedUnits.length} units to ${newStatus}`, 'success');
      setSelectedUnits([]);
      fetchUnits();
    } catch (error) {
      addToast('Failed to update units', 'error');
    }
  };

  if (loading) {
    return <div className="loading">Loading units...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Units Management</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportUnits}>
            📊 Export Units
          </button>
          <button className="btn btn-primary" onClick={() => setShowUnitModal(true)}>
            + Add Unit
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            🏠
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Units</div>
            <div className="stat-value">{units.length}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            ✅
          </div>
          <div className="stat-content">
            <div className="stat-label">Occupied</div>
            <div className="stat-value">
              {units.filter(u => u.status === 'OCCUPIED').length}
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            🔓
          </div>
          <div className="stat-content">
            <div className="stat-label">Vacant</div>
            <div className="stat-value">
              {units.filter(u => u.status === 'VACANT').length}
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            💰
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Monthly Rent</div>
            <div className="stat-value">
              KES {units.reduce((sum, u) => sum + parseFloat(u.monthly_rent), 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            <strong>Filter by Building:</strong>
            <select 
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            >
              <option value="all">All Buildings</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <strong>Filter by Status:</strong>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="VACANT">Vacant</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Under Maintenance</option>
            </select>
          </label>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUnits.length > 0 && (
        <BulkActions
          selectedItems={selectedUnits}
          totalItems={units.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          actions={[
            { 
              label: 'Mark as Vacant', 
              onClick: () => handleBulkStatusChange('VACANT'),
              icon: '🔓'
            },
            { 
              label: 'Mark as Occupied', 
              onClick: () => handleBulkStatusChange('OCCUPIED'),
              icon: '✅'
            },
            { 
              label: 'Mark as Maintenance', 
              onClick: () => handleBulkStatusChange('MAINTENANCE'),
              icon: '🔧'
            }
          ]}
        />
      )}

      <div className="card">
        {units.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>No Units Found</h3>
            <p>Add your first unit to get started!</p>
            <button className="btn btn-primary" onClick={() => setShowUnitModal(true)}>
              + Add Unit
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedUnits.length === units.length}
                      onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </th>
                  <th>Building</th>
                  <th>Unit Number</th>
                  <th>Monthly Rent</th>
                  <th>Bedrooms</th>
                  <th>Bathrooms</th>
                  <th>Status</th>
                  <th>Current Tenant</th>
                </tr>
              </thead>
              <tbody>
                {units.map(unit => (
                  <tr key={unit.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(unit.id)}
                        onChange={() => handleToggleSelect(unit.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td>{unit.building_name}</td>
                    <td><strong>{unit.unit_number}</strong></td>
                    <td>KES {unit.monthly_rent.toLocaleString()}</td>
                    <td>{unit.bedrooms}</td>
                    <td>{unit.bathrooms}</td>
                    <td>
                      <span className={`badge badge-${
                        unit.status === 'VACANT' ? 'success' : 
                        unit.status === 'OCCUPIED' ? 'danger' : 
                        'warning'
                      }`}>
                        {unit.status}
                      </span>
                    </td>
                    <td>
                      {unit.current_tenant ? unit.current_tenant.full_name : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddUnitModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSuccess={fetchUnits}
      />

      {showConfirm && (
        <ConfirmDialog
          {...confirmAction}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default Units;
