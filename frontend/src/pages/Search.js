import React, { useState } from 'react';
import { buildingsAPI, unitsAPI, tenantsAPI, paymentsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const [buildingsRes, unitsRes, tenantsRes, paymentsRes] = await Promise.all([
        buildingsAPI.getAll({ search: query }),
        unitsAPI.getAll({ search: query }),
        tenantsAPI.getAll({ search: query }),
        paymentsAPI.getAll({ search: query })
      ]);

      setResults({
        buildings: buildingsRes.data.results || buildingsRes.data,
        units: unitsRes.data.results || unitsRes.data,
        tenants: tenantsRes.data.results || tenantsRes.data,
        payments: paymentsRes.data.results || paymentsRes.data
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return results.buildings.length + results.units.length + 
           results.tenants.length + results.payments.length;
  };

  const filterResults = () => {
    if (!results) return null;
    
    switch (activeTab) {
      case 'BUILDINGS':
        return { buildings: results.buildings };
      case 'UNITS':
        return { units: results.units };
      case 'TENANTS':
        return { tenants: results.tenants };
      case 'PAYMENTS':
        return { payments: results.payments };
      default:
        return results;
    }
  };

  const filteredResults = filterResults();

  return (
    <div className="container">
      <h1>🔍 Global Search</h1>

      <div className="card">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Search buildings, units, tenants, payments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '1rem',
              fontSize: '1.1rem',
              borderRadius: '4px',
              border: '2px solid #ddd'
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </form>
      </div>

      {results && (
        <>
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className={`btn ${activeTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('ALL')}
              >
                All Results ({getTotalResults()})
              </button>
              <button
                className={`btn ${activeTab === 'BUILDINGS' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('BUILDINGS')}
              >
                Buildings ({results.buildings.length})
              </button>
              <button
                className={`btn ${activeTab === 'UNITS' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('UNITS')}
              >
                Units ({results.units.length})
              </button>
              <button
                className={`btn ${activeTab === 'TENANTS' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('TENANTS')}
              >
                Tenants ({results.tenants.length})
              </button>
              <button
                className={`btn ${activeTab === 'PAYMENTS' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('PAYMENTS')}
              >
                Payments ({results.payments.length})
              </button>
            </div>
          </div>

          {getTotalResults() === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
                No results found for "{query}"
              </p>
            </div>
          ) : (
            <div>
              {filteredResults.buildings && filteredResults.buildings.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h3>🏢 Buildings ({filteredResults.buildings.length})</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Total Units</th>
                        <th>Occupancy</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.buildings.map(building => (
                        <tr key={building.id}>
                          <td>{building.name}</td>
                          <td>{building.address}</td>
                          <td>{building.total_units}</td>
                          <td>{building.occupancy_rate?.toFixed(1)}%</td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.5rem 1rem' }}
                              onClick={() => navigate('/buildings')}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredResults.units && filteredResults.units.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h3>🏠 Units ({filteredResults.units.length})</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Unit Number</th>
                        <th>Building</th>
                        <th>Rent</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.units.map(unit => (
                        <tr key={unit.id}>
                          <td>{unit.unit_number}</td>
                          <td>{unit.building_name}</td>
                          <td>KES {unit.monthly_rent.toLocaleString()}</td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.85rem',
                              backgroundColor: unit.status === 'VACANT' ? '#27ae60' : 
                                             unit.status === 'OCCUPIED' ? '#e74c3c' : '#f39c12',
                              color: 'white'
                            }}>
                              {unit.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.5rem 1rem' }}
                              onClick={() => navigate('/units')}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredResults.tenants && filteredResults.tenants.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h3>👤 Tenants ({filteredResults.tenants.length})</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Unit</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.tenants.map(tenant => (
                        <tr key={tenant.id}>
                          <td>{tenant.name}</td>
                          <td>{tenant.email}</td>
                          <td>{tenant.phone_number}</td>
                          <td>{tenant.unit_number || '-'}</td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.5rem 1rem' }}
                              onClick={() => navigate('/tenants')}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredResults.payments && filteredResults.payments.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h3>💰 Payments ({filteredResults.payments.length})</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Tenant</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.payments.map(payment => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.transaction_date).toLocaleDateString()}</td>
                          <td>{payment.tenant_name}</td>
                          <td>KES {payment.amount.toLocaleString()}</td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.85rem',
                              backgroundColor: payment.payment_type === 'PAYMENT' ? '#27ae60' : '#3498db',
                              color: 'white'
                            }}>
                              {payment.payment_type}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.5rem 1rem' }}
                              onClick={() => navigate('/payments')}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Search;
