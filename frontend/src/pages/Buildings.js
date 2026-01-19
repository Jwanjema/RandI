import React, { useState, useEffect } from 'react';
import { buildingsAPI, unitsAPI } from '../services/api';
import AddBuildingModal from '../components/AddBuildingModal';
import AddUnitModal from '../components/AddUnitModal';
import { useToast } from '../components/Toast';
import { exportToCSV } from '../utils/exportUtils';

function Buildings() {
  const toast = useToast();
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  useEffect(() => {
    fetchBuildings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      // Handle both paginated and non-paginated responses
      const data = response.data.results || response.data;
      setBuildings(Array.isArray(data) ? data : []);
      setLoading(false);
      if (data.length > 0) {
        toast.success(`Loaded ${data.length} buildings`);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast.error('Failed to load buildings');
      setLoading(false);
    }
  };

  const fetchBuildingUnits = async (buildingId) => {
    try {
      const response = await unitsAPI.getAll({ building: buildingId });
      const data = response.data.results || response.data;
      setUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to load units');
    }
  };

  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
    fetchBuildingUnits(building.id);
    // Smooth scroll to units section on mobile
    setTimeout(() => {
      const unitsSection = document.getElementById('units-section');
      if (unitsSection && window.innerWidth <= 768) {
        unitsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const exportBuildings = () => {
    const data = buildings.map(b => ({
      'Building Name': b.name,
      'Address': b.address,
      'Total Units': b.total_units,
      'Occupied': b.occupied_units_count,
      'Vacant': b.vacant_units_count,
      'Occupancy Rate': `${b.occupancy_rate.toFixed(1)}%`,
      'Monthly Income': b.actual_monthly_income || 0,
      'Potential Income': b.total_potential_income || 0
    }));
    
    exportToCSV(data, `buildings-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Buildings data exported successfully!');
  };

  const exportUnits = () => {
    if (units.length === 0) {
      toast.warning('No units to export');
      return;
    }
    
    const data = units.map(u => ({
      'Building': selectedBuilding?.name,
      'Unit Number': u.unit_number,
      'Status': u.status,
      'Monthly Rent': u.monthly_rent,
      'Tenant': u.tenant_name || 'Vacant'
    }));
    
    exportToCSV(data, `${selectedBuilding?.name}-units-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Units data exported successfully!');
  };

  if (loading) {
    return (
      <div className="container animate-fade-in">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Buildings</h1>
          <p className="text-muted">Manage your property portfolio</p>
        </div>
        <div className="page-actions">
          {buildings.length > 0 && (
            <button className="btn btn-secondary" onClick={exportBuildings}>
              📊 Export Buildings
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowBuildingModal(true)}>
            + Add Building
          </button>
        </div>
      </div>

      {buildings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <div className="empty-state-title">No Buildings Yet</div>
          <div className="empty-state-description">
            Start by adding your first building to manage properties effectively
          </div>
          <button className="btn btn-primary" onClick={() => setShowBuildingModal(true)}>
            + Add Your First Building
          </button>
        </div>
      ) : (
        <div className="grid grid-3 animate-slide-in-up">
          {buildings.map(building => (
            <div 
              key={building.id} 
              className="card hover-lift"
              style={{ cursor: 'pointer', marginBottom: 0 }}
              onClick={() => handleBuildingClick(building)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 style={{ margin: 0 }}>{building.name}</h3>
                <span className="chip">
                  {building.total_units} {building.total_units === 1 ? 'Unit' : 'Units'}
                </span>
              </div>
              <p className="text-muted" style={{ marginBottom: '1rem' }}>
                <span style={{ marginRight: '0.25rem' }}>📍</span> {building.address}
              </p>
              <div className="divider" style={{ margin: '1rem 0' }}></div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">
                  <span className="status-dot danger"></span>
                  <strong>Occupied:</strong>
                </span>
                <span className="font-bold">{building.occupied_units_count}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">
                  <span className="status-dot success"></span>
                  <strong>Vacant:</strong>
                </span>
                <span className="font-bold">{building.vacant_units_count}</span>
              </div>
              
              <div className="divider" style={{ margin: '1rem 0' }}></div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Occupancy Rate</span>
                <span className="font-bold text-primary">{building.occupancy_rate.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${building.occupancy_rate}%`,
                    background: building.occupancy_rate > 70 ? 'var(--success-gradient)' : 'var(--warning-gradient)'
                  }}
                ></div>
              </div>
              
              {building.total_potential_income && (
                <>
                  <div className="divider" style={{ margin: '1rem 0' }}></div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted">Potential Income:</span>
                    <span className="text-sm font-semibold">
                      KES {building.total_potential_income.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Actual Income:</span>
                    <span className="text-sm font-semibold text-success">
                      KES {building.actual_monthly_income?.toLocaleString() || 0}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Units Section */}
      {selectedBuilding && (
        <div id="units-section" className="card animate-slide-in-up" style={{ marginTop: '2rem' }}>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div className="page-title">
              <h2 style={{ margin: 0 }}>{selectedBuilding.name} - Units</h2>
              <p className="text-muted">
                {units.length} {units.length === 1 ? 'unit' : 'units'} in this building
              </p>
            </div>
            <div className="page-actions">
              <button 
                className="btn btn-secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBuilding(null);
                  setUnits([]);
                }}
              >
                Close
              </button>
              {units.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={exportUnits}
                >
                  📄 Export Units
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setShowUnitModal(true)}>
                + Add Unit
              </button>
            </div>
          </div>

          {/* Building Stats Summary */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card" style={{ borderLeftColor: '#3498db' }}>
              <div className="stat-label">Total Units</div>
              <div className="stat-value">{selectedBuilding.total_units}</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#e74c3c' }}>
              <div className="stat-label">Occupied</div>
              <div className="stat-value">{selectedBuilding.occupied_units_count}</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
              <div className="stat-label">Vacant</div>
              <div className="stat-value">{selectedBuilding.vacant_units_count}</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#1abc9c' }}>
              <div className="stat-label">Occupancy Rate</div>
              <div className="stat-value">{selectedBuilding.occupancy_rate.toFixed(1)}%</div>
            </div>
          </div>

          {units.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚪</div>
              <div className="empty-state-title">No Units Yet</div>
              <div className="empty-state-description">
                Add units to this building to start managing them
              </div>
              <button className="btn btn-primary" onClick={() => setShowUnitModal(true)}>
                + Add First Unit
              </button>
            </div>
          ) : (
            <div className="unit-grid">
              {units.map(unit => (
                <div 
                  key={unit.id} 
                  className={`unit-box ${unit.status.toLowerCase()} hover-scale`}
                  title={`Unit ${unit.unit_number} - ${unit.status}`}
                >
                  <div className="unit-number">{unit.unit_number}</div>
                  <div className="unit-rent">KES {unit.monthly_rent.toLocaleString()}</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    marginTop: '0.5rem', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {unit.status}
                  </div>
                  {unit.tenant_name && (
                    <div style={{ 
                      fontSize: '0.7rem', 
                      marginTop: '0.25rem',
                      opacity: 0.9
                    }}>
                      {unit.tenant_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddBuildingModal
        isOpen={showBuildingModal}
        onClose={() => setShowBuildingModal(false)}
        onSuccess={fetchBuildings}
      />
      
      <AddUnitModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSuccess={() => {
          if (selectedBuilding) {
            fetchBuildingUnits(selectedBuilding.id);
            fetchBuildings(); // Refresh building stats
          }
        }}
        buildingId={selectedBuilding?.id}
      />
    </div>
  );
}

export default Buildings;
