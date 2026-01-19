import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../services/api';
import AddPaymentModal from '../components/AddPaymentModal';
import { useToast } from '../components/Toast';
import { exportToCSV } from '../utils/exportUtils';
import DateRangePicker from '../components/DateRangePicker';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { addToast } = useToast();

  const COLORS = ['#27ae60', '#e74c3c', '#3498db', '#f39c12', '#9b59b6'];

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.payment_type = filter;
      if (dateRange) {
        params.start_date = dateRange.startDate;
        params.end_date = dateRange.endDate;
      }
      
      const response = await paymentsAPI.getAll(params);
      const data = response.data.results || response.data;
      setPayments(Array.isArray(data) ? data : []);
      setLoading(false);
      addToast('Payments loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching payments:', error);
      addToast('Failed to load payments', 'error');
      setLoading(false);
    }
  };

  const handleDateRangeApply = (range) => {
    setDateRange(range);
    addToast(`Showing payments from ${range.startDate} to ${range.endDate}`, 'info');
  };

  const handleDateRangeClear = () => {
    setDateRange(null);
    addToast('Date filter cleared', 'info');
  };

  const exportPayments = () => {
    const exportData = payments.map(payment => ({
      'Date': new Date(payment.transaction_date).toLocaleDateString(),
      'Tenant': payment.tenant_name,
      'Building': payment.building_name,
      'Unit': payment.unit_number,
      'Type': payment.payment_type,
      'Description': payment.description,
      'Method': payment.payment_method || 'N/A',
      'Amount': payment.amount,
      'Reference': payment.reference_number || 'N/A'
    }));
    
    exportToCSV(exportData, 'payments-export');
    addToast('Payments exported successfully', 'success');
  };

  // Calculate analytics
  const analytics = {
    totalPayments: payments.filter(p => p.payment_type === 'PAYMENT').reduce((sum, p) => sum + parseFloat(p.amount), 0),
    totalCharges: payments.filter(p => p.payment_type === 'CHARGE').reduce((sum, p) => sum + parseFloat(p.amount), 0),
    transactionCount: payments.length,
    paymentCount: payments.filter(p => p.payment_type === 'PAYMENT').length,
    chargeCount: payments.filter(p => p.payment_type === 'CHARGE').length
  };

  const paymentMethodData = payments
    .filter(p => p.payment_type === 'PAYMENT' && p.payment_method)
    .reduce((acc, payment) => {
      const method = payment.payment_method;
      const existing = acc.find(item => item.name === method);
      if (existing) {
        existing.value += parseFloat(payment.amount);
      } else {
        acc.push({ name: method, value: parseFloat(payment.amount) });
      }
      return acc;
    }, []);

  const monthlyData = payments
    .reduce((acc, payment) => {
      const month = new Date(payment.transaction_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.month === month);
      const amount = parseFloat(payment.amount);
      
      if (existing) {
        if (payment.payment_type === 'PAYMENT') {
          existing.payments += amount;
        } else {
          existing.charges += amount;
        }
      } else {
        acc.push({
          month,
          payments: payment.payment_type === 'PAYMENT' ? amount : 0,
          charges: payment.payment_type === 'CHARGE' ? amount : 0
        });
      }
      return acc;
    }, [])
    .slice(-6); // Last 6 months

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Payments & Charges</h1>
        <div className="flex gap-2">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            📊 {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
          <button className="btn btn-secondary" onClick={exportPayments}>
            📥 Export
          </button>
          <button className="btn btn-success" onClick={() => setShowPaymentModal(true)}>
            + Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            💵
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{analytics.transactionCount}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            💰
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Payments</div>
            <div className="stat-value">KES {analytics.totalPayments.toLocaleString()}</div>
            <div className="stat-badge">{analytics.paymentCount} transactions</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            📝
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Charges</div>
            <div className="stat-value">KES {analytics.totalCharges.toLocaleString()}</div>
            <div className="stat-badge">{analytics.chargeCount} transactions</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            📈
          </div>
          <div className="stat-content">
            <div className="stat-label">Net Amount</div>
            <div className="stat-value" style={{ 
              color: analytics.totalPayments - analytics.totalCharges >= 0 ? 'var(--success)' : 'var(--danger)' 
            }}>
              KES {(analytics.totalPayments - analytics.totalCharges).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="grid-2">
          <div className="card">
            <h3>Monthly Payments vs Charges</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="payments" fill="#27ae60" name="Payments" />
                <Bar dataKey="charges" fill="#e74c3c" name="Charges" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3>Payment Methods Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="flex gap-2 items-center flex-wrap">
          <div>
            <label style={{ marginRight: '0.5rem' }}><strong>Filter by Type:</strong></label>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.5rem' }}
            >
              <option value="all">All Transactions</option>
              <option value="CHARGE">Charges Only</option>
              <option value="PAYMENT">Payments Only</option>
            </select>
          </div>

          <DateRangePicker
            onApply={handleDateRangeApply}
            onClear={handleDateRangeClear}
          />
        </div>
      </div>

      <div className="card">
        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No Transactions Found</h3>
            <p>Start recording payments and charges to track your finances.</p>
            <button className="btn btn-success" onClick={() => setShowPaymentModal(true)}>
              + Record Payment
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tenant</th>
                  <th>Building</th>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.transaction_date).toLocaleDateString()}</td>
                    <td>{payment.tenant_name}</td>
                    <td>{payment.building_name}</td>
                    <td>{payment.unit_number}</td>
                    <td>
                      <span className={`badge badge-${payment.payment_type === 'PAYMENT' ? 'success' : 'danger'}`}>
                        {payment.payment_type}
                      </span>
                    </td>
                    <td>{payment.description}</td>
                    <td>{payment.payment_method || '-'}</td>
                    <td style={{ 
                      fontWeight: 'bold',
                      color: payment.payment_type === 'PAYMENT' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {payment.payment_type === 'PAYMENT' ? '+' : '-'}KES {payment.amount.toLocaleString()}
                    </td>
                    <td>{payment.reference_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={fetchPayments}
      />
    </div>
  );
}

export default Payments;
