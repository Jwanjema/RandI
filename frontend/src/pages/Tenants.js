import React, { useState, useEffect } from 'react';
import { tenantsAPI } from '../services/api';
import AddTenantModal from '../components/AddTenantModal';
import { useToast } from '../components/Toast';
import { API_URL } from '../config';

function Tenants() {
  const toast = useToast();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [showTenantModal, setShowTenantModal] = useState(false);

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  const fetchTenants = async () => {
    try {
      const params = activeOnly ? { active: 'true' } : {};
      const response = await tenantsAPI.getAll(params);
      const data = response.data.results || response.data;
      setTenants(Array.isArray(data) ? data : []);
      setLoading(false);
      if (data.length > 0) {
        toast.success(`Loaded ${data.length} tenants`);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
      setLoading(false);
    }
  };

  const handleDownloadStatement = async (tenantId, tenantName) => {
    try {
      toast.info('Generating statement...');
      const response = await fetch(`${API_URL}/tenants/${tenantId}/statement_pdf/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download statement');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement_${tenantName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Statement downloaded successfully!');
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.error('Failed to download statement. Make sure backend is running.');
    }
  };

  const handleMoveOut = async (tenant) => {
    if (!window.confirm(`Mark ${tenant.full_name} as moved out? This will:\n- Close active leases\n- Keep all historical records\n- Mark unit as vacant`)) {
      return;
    }

    try {
      await tenantsAPI.moveOut(tenant.id, {
        move_out_date: new Date().toISOString().split('T')[0]
      });
      toast.success(`${tenant.full_name} marked as moved out. Records preserved.`);
      fetchTenants();
    } catch (error) {
      console.error('Error moving out tenant:', error);
      toast.error('Failed to mark tenant as moved out');
    }
  };

  if (loading) {
    return (
      <div className="container animate-fade-in">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      {/* Page Header - Responsive */}
      <div className="page-header">
        <div className="page-title">
          <h1>Tenants</h1>
          <p className="text-muted">Manage tenant information</p>
        </div>
        <div className="page-actions">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>Active Only</span>
          </label>
          <button className="btn btn-primary" onClick={() => setShowTenantModal(true)}>
            + Add Tenant
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid animate-slide-in-up" style={{ marginBottom: '2rem' }}>
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#3498db' }}>
          <div className="stat-label">Total Tenants</div>
          <div className="stat-value">{tenants.length}</div>
        </div>
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#27ae60' }}>
          <div className="stat-label">Active Tenants</div>
          <div className="stat-value">{tenants.filter(t => t.is_active).length}</div>
        </div>
        <div className="stat-card hover-lift" style={{ borderLeftColor: '#e74c3c' }}>
          <div className="stat-label">Total Outstanding</div>
          <div className="stat-value">
            KES {tenants.reduce((sum, t) => sum + (t.total_balance > 0 ? t.total_balance : 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="card">
        {tenants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No Tenants Found</div>
            <div className="empty-state-description">
              {activeOnly ? 'No active tenants at the moment' : 'Start by adding your first tenant'}
            </div>
            {!activeOnly && (
              <button className="btn btn-primary" onClick={() => setShowTenantModal(true)}>
                + Add Your First Tenant
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Unit</th>
                  <th>Phone</th>
                  <th>Move In Date</th>
                  <th>Monthly Rent</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => (
                  <tr key={tenant.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{tenant.full_name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{tenant.building_name}</div>
                    </td>
                    <td>
                      <span className="chip">{tenant.unit_number}</span>
                    </td>
                    <td>{tenant.phone}</td>
                    <td>{new Date(tenant.move_in_date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: '600' }}>KES {tenant.monthly_rent.toLocaleString()}</td>
                    <td>
                      <span className={`chip ${tenant.total_balance > 0 ? 'danger' : 'success'}`}>
                        KES {tenant.total_balance.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={`chip ${tenant.is_active ? 'success' : ''}`}>
                        {tenant.is_active ? 'Active' : 'Moved Out'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                          onClick={() => handleDownloadStatement(tenant.id, tenant.full_name)}
                          title="Download tenant statement PDF"
                        >
                          📄
                        </button>
                        {tenant.is_active && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                            onClick={() => handleMoveOut(tenant)}
                            title="Move Out"
                          >
                            🚪
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddTenantModal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        onSuccess={fetchTenants}
      />
    </div>
  );
}

export default Tenants;
