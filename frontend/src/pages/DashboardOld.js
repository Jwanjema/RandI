import React, { useState, useEffect } from 'react';
import { buildingsAPI, unitsAPI, tenantsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBuildings: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    totalTenants: 0,
    occupancyRate: 0,
  });
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [buildingsRes, unitsRes, tenantsRes] = await Promise.all([
        buildingsAPI.getAll(),
        unitsAPI.getAll(),
        tenantsAPI.getAll({ active: 'true' }),
      ]);

      const allUnits = unitsRes.data.results || unitsRes.data;
      const occupiedUnits = allUnits.filter(u => u.status === 'OCCUPIED').length;
      const vacantUnits = allUnits.filter(u => u.status === 'VACANT').length;

      const buildings = buildingsRes.data.results || buildingsRes.data;
      const tenants = tenantsRes.data.results || tenantsRes.data;
      
      setStats({
        totalBuildings: buildings.length,
        totalUnits: allUnits.length,
        occupiedUnits,
        vacantUnits,
        totalTenants: tenants.length,
        occupancyRate: allUnits.length > 0 ? ((occupiedUnits / allUnits.length) * 100).toFixed(1) : 0,
      });

      setBuildings(buildings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        {buildings.length === 0 && (
          <button className="btn btn-primary" onClick={() => navigate('/buildings')}>
            + Get Started - Add Your First Building
          </button>
        )}
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Buildings</div>
          <div className="stat-value">{stats.totalBuildings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Units</div>
          <div className="stat-value">{stats.totalUnits}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Occupied Units</div>
          <div className="stat-value">{stats.occupiedUnits}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vacant Units</div>
          <div className="stat-value">{stats.vacantUnits}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Tenants</div>
          <div className="stat-value">{stats.totalTenants}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Occupancy Rate</div>
          <div className="stat-value">{stats.occupancyRate}%</div>
        </div>
      </div>

      <div className="card">
        <h2>Buildings Overview</h2>
        {buildings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              No buildings added yet. Add your first building to get started!
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/buildings')}>
              Go to Buildings Page
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {buildings.map(building => (
              <div key={building.id} className="card">
                <h3>{building.name}</h3>
                <p><strong>Address:</strong> {building.address}</p>
                <p><strong>Total Units:</strong> {building.total_units}</p>
                <p><strong>Occupied:</strong> {building.occupied_units_count}</p>
                <p><strong>Vacant:</strong> {building.vacant_units_count}</p>
                <p><strong>Occupancy Rate:</strong> {building.occupancy_rate.toFixed(1)}%</p>
                <p><strong>Potential Income:</strong> KES {building.total_potential_income?.toLocaleString()}</p>
                <p><strong>Actual Income:</strong> KES {building.actual_monthly_income?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
