import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import axios from 'axios';

function TenantPortal() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      fetchPayments(parsedTenant.id);
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const fetchPayments = async (tenantId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/payments/?tenant=${tenantId}`, {
        withCredentials: true
      });
      const data = response.data.results || response.data;
      setPayments(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async () => {
    if (!tenantInfo) return;

    try {
      toast.info('Generating statement...');
      const response = await fetch(`http://localhost:8000/api/tenants/${tenantInfo.id}/statement_pdf/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download statement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_statement_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Statement downloaded!');
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.error('Failed to download statement');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/api/auth/logout/', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('tenant_info');
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="skeleton-card"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Enhanced Header */}
      <div className="page-header" style={{ 
        marginBottom: '3rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2.5rem',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700',
            marginBottom: '0.5rem',
            color: 'white'
          }}>
            Welcome, {user?.first_name || user?.username}! 👋
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>
            Your Tenant Portal - View your rental information and statements
          </p>
        </div>
        <button 
          className="btn" 
          onClick={handleLogout}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🚪 Logout
        </button>
      </div>

      {tenantInfo ? (
        <>
          {/* Enhanced Info Cards */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {/* Unit Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '6px solid #667eea',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'default'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
              <div style={{ fontSize: '0.875rem', color: '#667eea', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Your Unit
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#667eea', marginTop: '0.5rem' }}>
                {tenantInfo.unit}
              </div>
              <div style={{ fontSize: '1rem', color: '#666', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🏢</span>
                {tenantInfo.building}
              </div>
            </div>

            {/* Balance Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: `6px solid ${tenantInfo.balance > 0 ? '#f5576c' : '#43e97b'}`,
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'default'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = `0 12px 40px ${tenantInfo.balance > 0 ? 'rgba(245, 87, 108, 0.15)' : 'rgba(67, 233, 123, 0.15)'}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {tenantInfo.balance > 0 ? '💳' : '✅'}
              </div>
              <div style={{ fontSize: '0.875rem', color: tenantInfo.balance > 0 ? '#f5576c' : '#43e97b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Account Balance
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: tenantInfo.balance > 0 ? '#f5576c' : '#43e97b', marginTop: '0.5rem' }}>
                KES {tenantInfo.balance.toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '0.95rem', 
                color: '#666', 
                marginTop: '1rem',
                padding: '0.75rem',
                background: tenantInfo.balance > 0 ? 'rgba(245, 87, 108, 0.1)' : 'rgba(67, 233, 123, 0.1)',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {tenantInfo.balance > 0 ? '⚠️ Payment Due' : '🎉 All Paid Up!'}
              </div>
            </div>

            {/* Actions Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '6px solid #feca57',
              transition: 'transform 0.3s, box-shadow 0.3s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(254, 202, 87, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>📄</div>
              <div style={{ fontSize: '0.875rem', color: '#feca57', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                Your Statements
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleDownloadStatement}
                style={{ 
                  marginTop: '1.5rem', 
                  width: '100%',
                  background: 'linear-gradient(135deg, #feca57 0%, #ff9f43 100%)',
                  border: 'none',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(254, 202, 87, 0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(254, 202, 87, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(254, 202, 87, 0.3)';
                }}
              >
                📥 Download Statement
              </button>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#666', 
                textAlign: 'center', 
                marginTop: '1rem',
                marginBottom: 0 
              }}>
                Get a detailed PDF of your transactions
              </p>
            </div>

            {/* Maintenance Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '6px solid #48dbfb',
              transition: 'transform 0.3s, box-shadow 0.3s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(72, 219, 251, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>🔧</div>
              <div style={{ fontSize: '0.875rem', color: '#48dbfb', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                Maintenance Requests
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/tenant-maintenance')}
                style={{ 
                  marginTop: '1.5rem', 
                  width: '100%',
                  background: 'linear-gradient(135deg, #48dbfb 0%, #0abde3 100%)',
                  border: 'none',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(72, 219, 251, 0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(72, 219, 251, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(72, 219, 251, 0.3)';
                }}
              >
                🛠️ View Requests
              </button>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#666', 
                textAlign: 'center', 
                marginTop: '1rem',
                marginBottom: 0 
              }}>
                Submit and track maintenance issues
              </p>
            </div>
          </div>

          {/* Enhanced Recent Payments */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <h2 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '700', 
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '2rem' }}>💰</span>
              Recent Transactions
            </h2>
            {payments.length === 0 ? (
              <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💳</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#666', marginBottom: '0.5rem' }}>
                  No Transactions Yet
                </div>
                <div style={{ fontSize: '1rem', color: '#999' }}>
                  Your payment history will appear here
                </div>
              </div>
            ) : (
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(102, 126, 234, 0.05)' }}>
                      <th style={{ padding: '1rem', fontWeight: '600', color: '#667eea' }}>Date</th>
                      <th style={{ padding: '1rem', fontWeight: '600', color: '#667eea' }}>Type</th>
                      <th style={{ padding: '1rem', fontWeight: '600', color: '#667eea' }}>Description</th>
                      <th style={{ padding: '1rem', fontWeight: '600', color: '#667eea', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={payment.id} style={{ 
                        background: index % 2 === 0 ? '#fff' : 'rgba(0, 0, 0, 0.02)',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#fff' : 'rgba(0, 0, 0, 0.02)'}>
                        <td style={{ padding: '1rem', borderRadius: '8px 0 0 8px' }}>
                          {new Date(payment.transaction_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: payment.payment_type === 'CHARGE' ? 'rgba(245, 87, 108, 0.1)' : 'rgba(67, 233, 123, 0.1)',
                            color: payment.payment_type === 'CHARGE' ? '#f5576c' : '#43e97b'
                          }}>
                            {payment.payment_type === 'CHARGE' ? '📤 Charge' : '📥 Payment'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#666' }}>{payment.description}</td>
                        <td style={{ padding: '1rem', borderRadius: '0 8px 8px 0', textAlign: 'right' }}>
                          <span style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: '700',
                            color: payment.payment_type === 'CHARGE' ? '#f5576c' : '#43e97b'
                          }}>
                            {payment.payment_type === 'CHARGE' ? '+' : '-'}KES {payment.amount.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '4rem 2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>👤</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#666', marginBottom: '1rem' }}>
            Tenant Profile Not Found
          </div>
          <div style={{ fontSize: '1.1rem', color: '#999', marginBottom: '2rem' }}>
            Please contact the property administrator to link your account to a tenant profile.
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={handleLogout}
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            Return to Login
          </button>
        </div>
      )}
    </div>
  );
}

export default TenantPortal;
