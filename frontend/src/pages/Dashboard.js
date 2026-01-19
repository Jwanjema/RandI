import React, { useState, useEffect } from 'react';
import { buildingsAPI, unitsAPI, tenantsAPI, paymentsAPI, expensesAPI, maintenanceAPI, documentsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ChargeRentModal from '../components/ChargeRentModal';
import { useToast } from '../components/Toast';
import { exportToCSV } from '../utils/exportUtils';
import { 
  BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';

function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState({
    totalBuildings: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    totalTenants: 0,
    occupancyRate: 0,
    totalIncome: 0,
    pendingPayments: 0,
  });
  const [buildings, setBuildings] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChargeRentModal, setShowChargeRentModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [buildingsRes, unitsRes, tenantsRes, paymentsRes] = await Promise.all([
        buildingsAPI.getAll(),
        unitsAPI.getAll(),
        tenantsAPI.getAll({ active: 'true' }),
        paymentsAPI.getAll(),
      ]);

      const allUnits = unitsRes.data.results || unitsRes.data;
      const occupiedUnits = allUnits.filter(u => u.status === 'OCCUPIED').length;
      const vacantUnits = allUnits.filter(u => u.status === 'VACANT').length;

      const buildings = buildingsRes.data.results || buildingsRes.data;
      const tenants = tenantsRes.data.results || tenantsRes.data;
      const payments = paymentsRes.data.results || paymentsRes.data;

      // Calculate total income and pending
      const totalCharges = payments
        .filter(p => p.payment_type === 'CHARGE')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const totalPayments = payments
        .filter(p => p.payment_type === 'PAYMENT')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const pendingPayments = totalCharges - totalPayments;

      setStats({
        totalBuildings: buildings.length,
        totalUnits: allUnits.length,
        occupiedUnits,
        vacantUnits,
        totalTenants: tenants.length,
        occupancyRate: allUnits.length > 0 ? ((occupiedUnits / allUnits.length) * 100).toFixed(1) : 0,
        totalIncome: totalPayments,
        pendingPayments: pendingPayments > 0 ? pendingPayments : 0,
      });

      setBuildings(buildings);
      setRecentPayments(payments.slice(0, 5));
      setLoading(false);
      
      toast.success('Dashboard data loaded successfully!');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [buildingsRes, unitsRes, tenantsRes, paymentsRes, expensesRes, maintenanceRes, documentsRes] = await Promise.all([
        buildingsAPI.getAll().catch(() => ({ data: [] })),
        unitsAPI.getAll().catch(() => ({ data: [] })),
        tenantsAPI.getAll().catch(() => ({ data: [] })),
        paymentsAPI.getAll().catch(() => ({ data: [] })),
        expensesAPI.getAll().catch(() => ({ data: [] })),
        maintenanceAPI.getAll().catch(() => ({ data: [] })),
        documentsAPI.getAll().catch(() => ({ data: [] }))
      ]);

      const query = searchQuery.toLowerCase();
      let results = [];

      // Search buildings
      const buildings = (buildingsRes.data.results || buildingsRes.data || []).filter(b =>
        b.name?.toLowerCase().includes(query) || b.address?.toLowerCase().includes(query)
      ).map(b => ({ ...b, type: 'building' }));

      // Search units
      const units = (unitsRes.data.results || unitsRes.data || []).filter(u =>
        u.unit_number?.toLowerCase().includes(query) || u.building_name?.toLowerCase().includes(query)
      ).map(u => ({ ...u, type: 'unit' }));

      // Search tenants
      const tenants = (tenantsRes.data.results || tenantsRes.data || []).filter(t =>
        t.name?.toLowerCase().includes(query) || t.email?.toLowerCase().includes(query) || t.phone?.includes(query)
      ).map(t => ({ ...t, type: 'tenant' }));

      // Search payments
      const payments = (paymentsRes.data.results || paymentsRes.data || []).filter(p =>
        p.tenant_name?.toLowerCase().includes(query) || p.reference?.toLowerCase().includes(query)
      ).map(p => ({ ...p, type: 'payment' }));

      // Search expenses
      const expenses = (expensesRes.data.results || expensesRes.data || []).filter(e =>
        e.description?.toLowerCase().includes(query) || e.vendor?.toLowerCase().includes(query)
      ).map(e => ({ ...e, type: 'expense' }));

      // Search maintenance
      const maintenance = (maintenanceRes.data.results || maintenanceRes.data || []).filter(m =>
        m.title?.toLowerCase().includes(query) || m.description?.toLowerCase().includes(query)
      ).map(m => ({ ...m, type: 'maintenance' }));

      // Search documents
      const documents = (documentsRes.data.results || documentsRes.data || []).filter(d =>
        d.title?.toLowerCase().includes(query) || d.document_type?.toLowerCase().includes(query)
      ).map(d => ({ ...d, type: 'document' }));

      results = [...buildings, ...units, ...tenants, ...payments, ...expenses, ...maintenance, ...documents];
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const exportDashboardData = () => {
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
    
    exportToCSV(data, `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Dashboard data exported successfully!');
  };

  const exportPayments = () => {
    const data = recentPayments.map(p => ({
      'Date': new Date(p.transaction_date).toLocaleDateString(),
      'Tenant': p.tenant_name,
      'Type': p.payment_type,
      'Amount': p.amount,
      'Reference': p.reference || 'N/A'
    }));
    
    exportToCSV(data, `payments-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Payments exported successfully!');
  };

  const handleChargeRentSuccess = () => {
    fetchDashboardData();
    toast.success('Rent charged successfully!');
  };

  const getResultIcon = (type) => {
    const icons = {
      building: '🏢',
      unit: '🚪',
      tenant: '👤',
      payment: '💰',
      expense: '💸',
      maintenance: '🔧',
      document: '📄'
    };
    return icons[type] || '📋';
  };

  const navigateToResult = (result) => {
    const routes = {
      building: '/buildings',
      unit: '/units',
      tenant: '/tenants',
      payment: '/payments',
      expense: '/expenses',
      maintenance: '/maintenance',
      document: '/documents'
    };
    navigate(routes[result.type]);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // Data for charts
  const occupancyData = [
    { name: 'Occupied', value: stats.occupiedUnits, color: '#e74c3c' },
    { name: 'Vacant', value: stats.vacantUnits, color: '#27ae60' },
  ];

  const buildingData = buildings.map(b => ({
    name: b.name.substring(0, 15),
    units: b.total_units,
    occupied: b.occupied_units_count,
    vacant: b.vacant_units_count,
  }));

  const incomeData = [
    { name: 'Collected', amount: stats.totalIncome, color: '#27ae60' },
    { name: 'Pending', amount: stats.pendingPayments, color: '#f39c12' },
  ];

  return (
    <div className="container animate-fade-in">
      {/* Page Header - Responsive */}
      <div className="page-header">
        <div className="page-title">
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-light)', margin: '0.5rem 0 0 0' }}>
            Welcome back! Here's your property overview
          </p>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-secondary" 
            onClick={exportDashboardData}
            title="Export Dashboard Data"
          >
            📊 Export Data
          </button>
          <button 
            className="btn btn-success" 
            onClick={() => setShowChargeRentModal(true)}
          >
            ⚡ Charge Rent
          </button>
          {buildings.length === 0 && (
            <button className="btn btn-primary" onClick={() => navigate('/buildings')}>
              + Add Building
            </button>
          )}
        </div>
      </div>

      {/* Global Search Bar - Enhanced Responsive */}
      <div className="card" style={{ marginBottom: '2rem', position: 'relative' }}>
        <div className="flex flex-col gap-2 md:flex-row md:gap-3 md:items-center">
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Search everything..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  handleSearch();
                } else {
                  setSearchResults([]);
                }
              }}
              className="form-group input"
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'var(--bg-white)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {isSearching && (
              <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="loading" style={{ padding: 0, fontSize: '0.9rem' }}>Searching...</div>
              </div>
            )}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            style={{ minWidth: '120px' }}
          >
            Search
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--bg-white)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-dark)' }}>
                Found {searchResults.length} results
              </div>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => navigateToResult(result)}
                  className="hover-lift"
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'var(--bg-light)',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-light)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '1.5rem' }}>{getResultIcon(result.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {result.name || result.unit_number || result.title || result.description || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                        {result.building_name && ` • ${result.building_name}`}
                        {result.tenant_name && ` • ${result.tenant_name}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Stats Grid - Fully Responsive */}
      <div className="stats-grid animate-slide-in-up">
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#3498db' }}>
          <div className="stat-label">Total Buildings</div>
          <div className="stat-value">{stats.totalBuildings}</div>
          <div className="status-dot success" style={{ marginTop: '0.5rem' }}></div>
        </div>
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#9b59b6' }}>
          <div className="stat-label">Total Units</div>
          <div className="stat-value">{stats.totalUnits}</div>
          <div className="status-dot success" style={{ marginTop: '0.5rem' }}></div>
        </div>
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#e74c3c' }}>
          <div className="stat-label">Occupied Units</div>
          <div className="stat-value">{stats.occupiedUnits}</div>
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: `${stats.occupancyRate}%` }}></div>
          </div>
        </div>
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#27ae60' }}>
          <div className="stat-label">Vacant Units</div>
          <div className="stat-value">{stats.vacantUnits}</div>
          <span className="chip success" style={{ marginTop: '0.5rem' }}>Available</span>
        </div>
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#f39c12' }}>
          <div className="stat-label">Active Tenants</div>
          <div className="stat-value">{stats.totalTenants}</div>
          <span className="chip" style={{ marginTop: '0.5rem' }}>Active</span>
        </div>
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#1abc9c' }}>
          <div className="stat-label">Occupancy Rate</div>
          <div className="stat-value">{stats.occupancyRate}%</div>
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: `${stats.occupancyRate}%`, background: 'var(--info-gradient)' }}></div>
          </div>
        </div>
      </div>

      {/* Financial Overview - Responsive Grid */}
      <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card hover-lift">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <h3 style={{ margin: 0 }}>Financial Overview</h3>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '1rem', 
              backgroundColor: 'rgba(39, 174, 96, 0.1)', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '0.75rem',
              borderLeft: '4px solid #27ae60'
            }}>
              <span className="font-semibold">Total Income Collected:</span>
              <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '1.1rem' }}>
                KES {stats.totalIncome.toLocaleString()}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '1rem', 
              backgroundColor: 'rgba(243, 156, 18, 0.1)', 
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid #f39c12'
            }}>
              <span className="font-semibold">Pending Payments:</span>
              <span style={{ color: '#f39c12', fontWeight: 'bold', fontSize: '1.1rem' }}>
                KES {stats.pendingPayments.toLocaleString()}
              </span>
            </div>
          </div>
          {incomeData[0].amount + incomeData[1].amount > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card hover-lift">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <h3 style={{ margin: 0 }}>Occupancy Status</h3>
          </div>
          {stats.totalUnits > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <div className="empty-state-description">No units available</div>
            </div>
          )}
        </div>
      </div>

      {/* Buildings Chart - Responsive */}
      {buildingData.length > 0 && (
        <div className="card hover-lift" style={{ marginTop: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: '1.5rem' }}>🏢</span>
            <h3 style={{ margin: 0 }}>Units by Building</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <ResponsiveContainer width="100%" height={300} minWidth={300}>
              <BarChart data={buildingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupied" fill="#e74c3c" name="Occupied" radius={[8, 8, 0, 0]} />
                <Bar dataKey="vacant" fill="#27ae60" name="Vacant" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Buildings Overview - Enhanced Cards */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Buildings Overview</h2>
          <button className="btn btn-primary" onClick={() => navigate('/buildings')}>
            View All Buildings
          </button>
        </div>
        {buildings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">No Buildings Yet</div>
            <div className="empty-state-description">
              Add your first building to start managing properties
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/buildings')}>
              Add Your First Building
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {buildings.map(building => (
              <div 
                key={building.id} 
                className="card hover-lift" 
                style={{ cursor: 'pointer', marginBottom: 0 }} 
                onClick={() => navigate('/buildings')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 style={{ margin: 0 }}>{building.name}</h3>
                  <span className="chip">{building.total_units} Units</span>
                </div>
                <p className="text-muted" style={{ marginBottom: '1rem' }}>
                  <strong>📍</strong> {building.address}
                </p>
                <div className="divider"></div>
                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div>
                    <p><span className="status-dot danger"></span><strong>Occupied:</strong> {building.occupied_units_count}</p>
                    <p><span className="status-dot success"></span><strong>Vacant:</strong> {building.vacant_units_count}</p>
                  </div>
                  <div>
                    <p><strong>Rate:</strong> {building.occupancy_rate.toFixed(1)}%</p>
                    <p><strong>Income:</strong> <span className="text-success">KES {building.actual_monthly_income?.toLocaleString()}</span></p>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: '1rem' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${building.occupancy_rate}%`,
                      background: building.occupancy_rate > 70 ? 'var(--success-gradient)' : 'var(--warning-gradient)'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payments - Responsive Table */}
      {recentPayments.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>💳 Recent Transactions</h3>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={exportPayments}>
                📄 Export
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/payments')}>
                View All
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tenant</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map(payment => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.transaction_date).toLocaleDateString()}</td>
                    <td>{payment.tenant_name}</td>
                    <td>
                      <span className={`chip ${payment.payment_type === 'PAYMENT' ? 'success' : 'danger'}`}>
                        {payment.payment_type}
                      </span>
                    </td>
                    <td style={{ 
                      fontWeight: 'bold', 
                      color: payment.payment_type === 'PAYMENT' ? 'var(--success-color)' : 'var(--danger-color)' 
                    }}>
                      {payment.payment_type === 'PAYMENT' ? '+' : '-'}KES {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showChargeRentModal && (
        <ChargeRentModal
          onClose={() => setShowChargeRentModal(false)}
          onSuccess={handleChargeRentSuccess}
        />
      )}
    </div>
  );
}

export default Dashboard;
