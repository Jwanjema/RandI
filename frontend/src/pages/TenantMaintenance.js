import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import axios from 'axios';

function TenantMaintenance() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const tenantData = localStorage.getItem('tenant_info');

    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (tenantData) {
      const parsedTenant = JSON.parse(tenantData);
      setTenantInfo(parsedTenant);
      fetchRequests(parsedTenant.id);
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const fetchRequests = async (tenantId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/maintenance/?tenant=${tenantId}`, {
        withCredentials: true
      });
      const data = response.data.results || response.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tenantInfo) {
      toast.error('Tenant information not found');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/maintenance/', {
        tenant: tenantInfo.id,
        unit: tenantInfo.unit_id || tenantInfo.unit,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'PENDING'
      }, {
        withCredentials: true
      });

      toast.success('Maintenance request submitted!');
      setShowForm(false);
      setFormData({ title: '', description: '', priority: 'MEDIUM' });
      fetchRequests(tenantInfo.id);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#feca57',
      'IN_PROGRESS': '#48dbfb',
      'COMPLETED': '#1dd1a1',
      'CANCELLED': '#ee5a6f'
    };
    return colors[status] || '#95afc0';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': '#95afc0',
      'MEDIUM': '#feca57',
      'HIGH': '#ee5a6f',
      'URGENT': '#c23616'
    };
    return colors[priority] || '#95afc0';
  };

  if (loading) {
    return <div className="container"><div className="skeleton-card"></div></div>;
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div className="page-header" style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'white' }}>
            🔧 Maintenance Requests
          </h1>
          <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>
            Submit and track your maintenance requests
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn"
            onClick={() => navigate('/tenant-portal')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              padding: '0.75rem 1.5rem'
            }}
          >
            ← Back to Portal
          </button>
          <button 
            className="btn btn-success"
            onClick={() => setShowForm(!showForm)}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#667eea',
              border: 'none',
              padding: '0.75rem 1.5rem',
              fontWeight: '600'
            }}
          >
            {showForm ? '✖ Cancel' : '+ New Request'}
          </button>
        </div>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #667eea' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span> Submit New Maintenance Request
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Issue Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Leaking faucet in bathroom"
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please describe the issue in detail..."
                required
                rows="4"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            <div className="form-group">
              <label>Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="LOW">Low - Can wait</option>
                <option value="MEDIUM">Medium - Should be addressed soon</option>
                <option value="HIGH">High - Needs attention</option>
                <option value="URGENT">Urgent - Immediate attention required</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                🚀 Submit Request
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowForm(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests List */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📋</span> Your Maintenance Requests ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔧</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#666', marginBottom: '0.5rem' }}>
              No Maintenance Requests
            </div>
            <div style={{ fontSize: '1rem', color: '#999', marginBottom: '2rem' }}>
              Submit your first maintenance request using the button above
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {requests.map((request) => (
              <div 
                key={request.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  background: '#fff',
                  transition: 'all 0.3s',
                  borderLeft: `4px solid ${getStatusColor(request.status)}`
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {request.title}
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      Submitted: {new Date(request.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      background: `${getStatusColor(request.status)}20`,
                      color: getStatusColor(request.status)
                    }}>
                      {request.status.replace('_', ' ')}
                    </span>
                    <span style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      background: `${getPriorityColor(request.priority)}20`,
                      color: getPriorityColor(request.priority)
                    }}>
                      {request.priority} Priority
                    </span>
                  </div>
                </div>

                <p style={{ color: '#666', marginBottom: '1rem', lineHeight: '1.6' }}>
                  {request.description}
                </p>

                {request.notes && (
                  <div style={{
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '1rem',
                    borderLeft: '3px solid #667eea'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#667eea', marginBottom: '0.5rem' }}>
                      📌 Admin Notes:
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#666' }}>
                      {request.notes}
                    </div>
                  </div>
                )}

                {request.assigned_to && (
                  <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                    👷 Assigned to: <strong>{request.assigned_to}</strong>
                  </div>
                )}

                {request.completed_at && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#1dd1a1', fontWeight: '600' }}>
                    ✅ Completed: {new Date(request.completed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantMaintenance;
