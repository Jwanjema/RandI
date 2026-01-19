import React, { useState, useEffect } from 'react';
import { maintenanceAPI, tenantsAPI } from '../services/api';

function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    tenant: '',
    unit: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'OTHER',
    assigned_to: '',
    estimated_cost: ''
  });

  const fetchRequests = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await maintenanceAPI.getAll(params);
      const data = response.data.results || response.data;
      setRequests(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await tenantsAPI.getAll({ active: 'true' });
      const data = response.data.results || response.data;
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tenant = tenants.find(t => t.id === parseInt(formData.tenant));
      const submitData = {
        ...formData,
        unit: tenant?.unit
      };
      
      if (!submitData.assigned_to) delete submitData.assigned_to;
      if (!submitData.estimated_cost) delete submitData.estimated_cost;

      await maintenanceAPI.create(submitData);
      setShowModal(false);
      setFormData({
        tenant: '',
        unit: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        category: 'OTHER',
        assigned_to: '',
        estimated_cost: ''
      });
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create maintenance request');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await maintenanceAPI.updateStatus(id, { status: newStatus });
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': '#3498db',
      'MEDIUM': '#f39c12',
      'HIGH': '#e67e22',
      'URGENT': '#e74c3c'
    };
    return colors[priority] || '#95a5a6';
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Maintenance Requests</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Request
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem', fontWeight: 'bold' }}>Filter by Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card">
        {requests.length === 0 ? (
          <p>No maintenance requests found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Tenant</th>
                <th>Unit</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td>{new Date(request.reported_date).toLocaleDateString()}</td>
                  <td>{request.title}</td>
                  <td>{request.tenant_name}</td>
                  <td>{request.unit_number}</td>
                  <td>{request.category}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: getPriorityColor(request.priority),
                      color: 'white',
                      fontSize: '0.85rem'
                    }}>
                      {request.priority}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: request.status === 'COMPLETED' ? '#27ae60' : 
                                     request.status === 'IN_PROGRESS' ? '#f39c12' : '#95a5a6',
                      color: 'white',
                      fontSize: '0.85rem'
                    }}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                      <select
                        onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
                        defaultValue=""
                        style={{ padding: '0.25rem', fontSize: '0.85rem' }}
                      >
                        <option value="" disabled>Update Status</option>
                        <option value="IN_PROGRESS">Start Work</option>
                        <option value="COMPLETED">Mark Complete</option>
                        <option value="CANCELLED">Cancel</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Maintenance Request</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tenant*</label>
                <select
                  value={formData.tenant}
                  onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                  required
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.full_name} - {tenant.unit_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Title*</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Leaking faucet"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description*</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category*</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="APPLIANCE">Appliance</option>
                    <option value="STRUCTURAL">Structural</option>
                    <option value="PEST">Pest Control</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority*</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assigned To</label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    placeholder="Technician name"
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Cost (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary">Create Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Maintenance;
