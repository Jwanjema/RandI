import React, { useState, useEffect } from 'react';
import { buildingsAPI, paymentsAPI, expensesAPI, tenantsAPI, leasesAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

function AdvancedReports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('income-statement');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expiringLeases, setExpiringLeases] = useState([]);

  useEffect(() => {
    generateReport();
  }, [dateRange, reportType]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const [buildingsRes, paymentsRes, expensesRes, tenantsRes] = await Promise.all([
        buildingsAPI.getAll(),
        paymentsAPI.getAll(),
        expensesAPI.getAll(),
        tenantsAPI.getAll({ active: 'true' })
      ]);

      const buildings = buildingsRes.data.results || buildingsRes.data;
      const allPayments = paymentsRes.data.results || paymentsRes.data;
      const allExpenses = expensesRes.data.results || expensesRes.data;
      const tenants = tenantsRes.data.results || tenantsRes.data;

      // Filter by date range
      const payments = allPayments.filter(p => {
        const date = new Date(p.transaction_date);
        return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
      });

      const expenses = allExpenses.filter(e => {
        const date = new Date(e.expense_date);
        return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
      });

      // Calculate metrics
      const totalIncome = payments
        .filter(p => p.payment_type === 'PAYMENT')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalCharges = payments
        .filter(p => p.payment_type === 'CHARGE')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const netIncome = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(2) : 0;

      // Outstanding rent
      const outstandingRent = tenants.reduce((sum, t) => sum + (parseFloat(t.total_balance) || 0), 0);

      // Expense breakdown by category
      const expenseByCategory = expenses.reduce((acc, exp) => {
        const category = exp.category || 'Other';
        const existing = acc.find(item => item.name === category);
        if (existing) {
          existing.value += parseFloat(exp.amount);
        } else {
          acc.push({ name: category, value: parseFloat(exp.amount) });
        }
        return acc;
      }, []);

      // Monthly income vs expenses
      const monthlyData = {};
      
      payments.forEach(p => {
        if (p.payment_type === 'PAYMENT') {
          const month = new Date(p.transaction_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!monthlyData[month]) {
            monthlyData[month] = { month, income: 0, expenses: 0 };
          }
          monthlyData[month].income += parseFloat(p.amount);
        }
      });

      expenses.forEach(e => {
        const month = new Date(e.expense_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expenses: 0 };
        }
        monthlyData[month].expenses += parseFloat(e.amount);
      });

      const monthlyTrend = Object.values(monthlyData).sort((a, b) => 
        new Date(a.month) - new Date(b.month)
      ).map(item => ({
        ...item,
        netIncome: item.income - item.expenses
      }));

      // Occupancy rate
      const totalUnits = buildings.reduce((sum, b) => sum + b.total_units, 0);
      const occupiedUnits = buildings.reduce((sum, b) => sum + b.occupied_units_count, 0);
      const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(2) : 0;

      // Revenue per building
      const buildingRevenue = buildings.map(building => ({
        name: building.name,
        revenue: building.actual_monthly_income || 0,
        potential: building.total_potential_income || 0,
        occupancy: building.occupancy_rate || 0
      }));

      setAnalytics({
        totalIncome,
        totalCharges,
        totalExpenses,
        netIncome,
        profitMargin,
        outstandingRent,
        expenseByCategory,
        monthlyTrend,
        occupancyRate,
        buildingRevenue,
        totalUnits,
        occupiedUnits,
        tenantCount: tenants.length,
        buildingCount: buildings.length
      });

      // Fetch expiring leases
      try {
        const leasesRes = await leasesAPI.getExpiringSoon();
        setExpiringLeases(leasesRes.data);
      } catch (error) {
        console.error('Error fetching leases:', error);
      }

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const csvData = [
      ['Advanced Financial Report'],
      [`Period: ${dateRange.start} to ${dateRange.end}`],
      [''],
      ['INCOME STATEMENT'],
      ['Total Income (Payments Received)', analytics.totalIncome.toLocaleString()],
      ['Total Charges (Rent Billed)', analytics.totalCharges.toLocaleString()],
      ['Total Expenses', analytics.totalExpenses.toLocaleString()],
      ['Net Income', analytics.netIncome.toLocaleString()],
      ['Profit Margin', `${analytics.profitMargin}%`],
      [''],
      ['PORTFOLIO METRICS'],
      ['Occupancy Rate', `${analytics.occupancyRate}%`],
      ['Total Units', analytics.totalUnits],
      ['Occupied Units', analytics.occupiedUnits],
      ['Active Tenants', analytics.tenantCount],
      ['Total Buildings', analytics.buildingCount],
      ['Outstanding Rent', analytics.outstandingRent.toLocaleString()],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

  if (loading && !analytics) {
    return <div className="container"><div className="loading">Loading report...</div></div>;
  }

  return (
    <div className="container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>📊 Advanced Financial Reports</h1>
          <p className="text-muted">Comprehensive analytics and insights</p>
        </div>
        <button className="btn btn-primary" onClick={exportToCSV}>
          📥 Export CSV
        </button>
      </div>

      {/* Date Range & Report Type */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
            >
              <option value="income-statement">Income Statement</option>
              <option value="cash-flow">Cash Flow Analysis</option>
              <option value="expense-breakdown">Expense Breakdown</option>
              <option value="occupancy-analysis">Occupancy Analysis</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <button 
            className="btn btn-success" 
            onClick={generateReport}
            style={{ marginTop: '1.7rem' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                💰
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Income</div>
                <div className="stat-value">KES {analytics.totalIncome.toLocaleString()}</div>
                <div className="stat-badge">Payments received</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)' }}>
                💸
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Expenses</div>
                <div className="stat-value">KES {analytics.totalExpenses.toLocaleString()}</div>
                <div className="stat-badge">Operating costs</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                📈
              </div>
              <div className="stat-content">
                <div className="stat-label">Net Income</div>
                <div className="stat-value" style={{ color: analytics.netIncome >= 0 ? '#43e97b' : '#f5576c' }}>
                  KES {analytics.netIncome.toLocaleString()}
                </div>
                <div className="stat-badge">Profit margin: {analytics.profitMargin}%</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                ⚠️
              </div>
              <div className="stat-content">
                <div className="stat-label">Outstanding Rent</div>
                <div className="stat-value">KES {analytics.outstandingRent.toLocaleString()}</div>
                <div className="stat-badge">Receivables</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                🏠
              </div>
              <div className="stat-content">
                <div className="stat-label">Occupancy Rate</div>
                <div className="stat-value">{analytics.occupancyRate}%</div>
                <div className="stat-badge">{analytics.occupiedUnits}/{analytics.totalUnits} units</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                👥
              </div>
              <div className="stat-content">
                <div className="stat-label">Active Tenants</div>
                <div className="stat-value">{analytics.tenantCount}</div>
                <div className="stat-badge">In {analytics.buildingCount} buildings</div>
              </div>
            </div>
          </div>

          {/* Income Statement */}
          {reportType === 'income-statement' && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>📋 Income Statement</h3>
              <table className="table">
                <tbody>
                  <tr style={{ background: '#f8f9fa' }}>
                    <td style={{ fontWeight: '600', fontSize: '1.1rem' }}>Revenue</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '2rem' }}>Rent Charged</td>
                    <td style={{ textAlign: 'right' }}>KES {analytics.totalCharges.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '2rem' }}>Payments Received</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>KES {analytics.totalIncome.toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
                    <td style={{ fontWeight: '600', fontSize: '1.1rem' }}>Expenses</td>
                    <td></td>
                  </tr>
                  {analytics.expenseByCategory.map((cat, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingLeft: '2rem' }}>{cat.name}</td>
                      <td style={{ textAlign: 'right' }}>KES {cat.value.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
                    <td style={{ fontWeight: '600' }}>Total Expenses</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>KES {analytics.totalExpenses.toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: analytics.netIncome >= 0 ? '#d4edda' : '#f8d7da', borderTop: '3px solid #000', fontSize: '1.1rem' }}>
                    <td style={{ fontWeight: '700' }}>Net Income</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: analytics.netIncome >= 0 ? '#155724' : '#721c24' }}>
                      KES {analytics.netIncome.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Monthly Trend */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>📅 Monthly Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#43e97b" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#f5576c" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="netIncome" stroke="#667eea" strokeWidth={2} name="Net Income" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Expense Breakdown */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>💸 Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Building Performance */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🏢 Building Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.buildingRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#667eea" name="Actual Revenue" />
                <Bar dataKey="potential" fill="#f093fb" name="Potential Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expiring Leases Alert */}
          {expiringLeases.length > 0 && (
            <div className="card" style={{ background: '#fff3cd', border: '1px solid #ffc107' }}>
              <h3 style={{ marginBottom: '1rem', color: '#856404' }}>⚠️ Expiring Leases ({expiringLeases.length})</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Unit</th>
                    <th>End Date</th>
                    <th>Days Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringLeases.map(lease => (
                    <tr key={lease.id}>
                      <td>{lease.tenant_name}</td>
                      <td>{lease.unit_number}</td>
                      <td>{new Date(lease.end_date).toLocaleDateString()}</td>
                      <td>
                        <span className="chip danger">
                          {Math.ceil((new Date(lease.end_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdvancedReports;
