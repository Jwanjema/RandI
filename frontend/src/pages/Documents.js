import React, { useState, useEffect } from 'react';
import { documentsAPI, buildingsAPI, unitsAPI, tenantsAPI } from '../services/api';
import { API_URL } from '../config';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [newDocument, setNewDocument] = useState({
    name: '',
    document_type: 'LEASE',
    related_to: '',
    building: '',
    unit: '',
    tenant: '',
    notes: '',
    expiry_date: ''
  });

  const documentTypes = [
    { value: 'LEASE', label: 'Lease Agreement' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'RECEIPT', label: 'Receipt' },
    { value: 'ID', label: 'Identification' },
    { value: 'OTHER', label: 'Other' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, buildingsRes, unitsRes, tenantsRes] = await Promise.all([
        documentsAPI.getAll(),
        buildingsAPI.getAll(),
        unitsAPI.getAll(),
        tenantsAPI.getAll()
      ]);
      setDocuments(docsRes.data.results || docsRes.data);
      setBuildings(buildingsRes.data.results || buildingsRes.data);
      setUnits(unitsRes.data.results || unitsRes.data);
      setTenants(tenantsRes.data.results || tenantsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setNewDocument({ ...newDocument, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newDocument.name);
      formData.append('document_type', newDocument.document_type);
      formData.append('related_to', newDocument.related_to);
      if (newDocument.building) formData.append('building', newDocument.building);
      if (newDocument.unit) formData.append('unit', newDocument.unit);
      if (newDocument.tenant) formData.append('tenant', newDocument.tenant);
      if (newDocument.notes) formData.append('notes', newDocument.notes);
      if (newDocument.expiry_date) formData.append('expiry_date', newDocument.expiry_date);
      if (newDocument.file) formData.append('file', newDocument.file);

      await documentsAPI.create(formData);
      fetchData();
      setShowModal(false);
      setNewDocument({
        name: '',
        document_type: 'LEASE',
        related_to: '',
        building: '',
        unit: '',
        tenant: '',
        notes: '',
        expiry_date: ''
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please check all required fields.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentsAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const getDocumentTypeLabel = (type) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'ALL') return true;
    if (filter === 'EXPIRING') return isExpiringSoon(doc.expiry_date);
    if (filter === 'EXPIRED') return isExpired(doc.expiry_date);
    return doc.document_type === filter;
  });

  if (loading) return <div className="container"><div className="loading">Loading...</div></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>📄 Document Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Upload Document
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: '500' }}>Filter:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="ALL">All Documents ({documents.length})</option>
            <option value="EXPIRING">Expiring Soon ({documents.filter(d => isExpiringSoon(d.expiry_date)).length})</option>
            <option value="EXPIRED">Expired ({documents.filter(d => isExpired(d.expiry_date)).length})</option>
            <option value="LEASE">Lease Agreements</option>
            <option value="CONTRACT">Contracts</option>
            <option value="INVOICE">Invoices</option>
            <option value="RECEIPT">Receipts</option>
            <option value="ID">Identification</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#7f8c8d' }}>
          <p>No documents found</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{doc.name}</h3>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    backgroundColor: '#3498db',
                    color: 'white'
                  }}>
                    {getDocumentTypeLabel(doc.document_type)}
                  </span>
                </div>
                <button 
                  className="btn btn-danger" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => handleDelete(doc.id)}
                >
                  🗑️
                </button>
              </div>

              {doc.expiry_date && (
                <div style={{ 
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '0.5rem',
                  backgroundColor: isExpired(doc.expiry_date) ? '#fee' : 
                                  isExpiringSoon(doc.expiry_date) ? '#fef3cd' : '#e8f5e9',
                  color: isExpired(doc.expiry_date) ? '#c00' : 
                         isExpiringSoon(doc.expiry_date) ? '#856404' : '#2e7d32'
                }}>
                  <strong>
                    {isExpired(doc.expiry_date) ? '⚠️ Expired: ' : 
                     isExpiringSoon(doc.expiry_date) ? '⚠️ Expires: ' : '✓ Expires: '}
                  </strong>
                  {new Date(doc.expiry_date).toLocaleDateString()}
                </div>
              )}

              <div style={{ marginBottom: '0.5rem', color: '#7f8c8d', fontSize: '0.9rem' }}>
                <div><strong>Related to:</strong> {doc.related_to}</div>
                {doc.building_name && <div><strong>Building:</strong> {doc.building_name}</div>}
                {doc.unit_number && <div><strong>Unit:</strong> {doc.unit_number}</div>}
                {doc.tenant_name && <div><strong>Tenant:</strong> {doc.tenant_name}</div>}
                {doc.notes && <div style={{ marginTop: '0.5rem' }}><strong>Notes:</strong> {doc.notes}</div>}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#95a5a6', marginTop: '0.5rem' }}>
                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
              </div>

              {doc.file && (
                <a 
                  href={`${API_URL.replace('/api', '')}${doc.file}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
                >
                  📥 Download
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload New Document</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Document Name *</label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Document Type *</label>
                <select
                  value={newDocument.document_type}
                  onChange={(e) => setNewDocument({ ...newDocument, document_type: e.target.value })}
                  required
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Related To *</label>
                <input
                  type="text"
                  value={newDocument.related_to}
                  onChange={(e) => setNewDocument({ ...newDocument, related_to: e.target.value })}
                  placeholder="e.g., Property Purchase, Tenant John Doe"
                  required
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Building (Optional)</label>
                  <select
                    value={newDocument.building}
                    onChange={(e) => setNewDocument({ ...newDocument, building: e.target.value })}
                  >
                    <option value="">-- Select Building --</option>
                    {buildings.map(building => (
                      <option key={building.id} value={building.id}>{building.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit (Optional)</label>
                  <select
                    value={newDocument.unit}
                    onChange={(e) => setNewDocument({ ...newDocument, unit: e.target.value })}
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
                <label>Tenant (Optional)</label>
                <select
                  value={newDocument.tenant}
                  onChange={(e) => setNewDocument({ ...newDocument, tenant: e.target.value })}
                >
                  <option value="">-- Select Tenant --</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={newDocument.expiry_date}
                  onChange={(e) => setNewDocument({ ...newDocument, expiry_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>File *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={newDocument.notes}
                  onChange={(e) => setNewDocument({ ...newDocument, notes: e.target.value })}
                  rows="3"
                  placeholder="Additional notes about this document"
                />
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

export default Documents;
