import React, { useState, useEffect } from 'react';
import { buildingsAPI, paymentsAPI, expensesAPI, leasesAPI } from '../services/api';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

function Reports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [expiringLeases, setExpiringLeases] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpiringLeases();
  }, []);

  const fetchExpiringLeases = async () => {
    try {
      const response = await leasesAPI.getExpiringSoon();
      setExpiringLeases(response.data);
    } catch (error) {
      console.error('Error fetching expiring leases:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const [buildingsRes, paymentsRes, expensesRes] = await Promise.all([
        buildingsAPI.getAll(),
        paymentsAPI.getAll({ start_date: dateRange.start, end_date: dateRange.end }),
        expensesAPI.getAll({ start_date: dateRange.start, end_date: dateRange.end })
      ]);

      const buildings = buildingsRes.data.results || buildingsRes.data;
      const payments = paymentsRes.data.results || paymentsRes.data;
      const expenses = expensesRes.data.results || expensesRes.data;

      const totalIncome = payments
        .filter(p => p.payment_type === 'PAYMENT')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalCharges = payments
        .filter(p => p.payment_type === 'CHARGE')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const netIncome = totalIncome - totalExpenses;

      // Group payments by month
      const monthlyData = {};
      payments.forEach(payment => {
        const month = new Date(payment.transaction_date).toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expenses: 0 };
        }
        if (payment.payment_type === 'PAYMENT') {
          monthlyData[month].income += parseFloat(payment.amount);
        }
      });

      expenses.forEach(expense => {
        const month = new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expenses: 0 };
        }
        monthlyData[month].expenses += parseFloat(expense.amount);
      });

      // Expense by category
      const expensesByCategory = {};
      expenses.forEach(expense => {
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = 0;
        }
        expensesByCategory[expense.category] += parseFloat(expense.amount);
      });

      const expenseCategoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
        name,
        value
      }));

      setReportData({
        summary: {
          totalIncome,
          totalCharges,
          totalExpenses,
          netIncome,
          collectionRate: totalCharges > 0 ? (totalIncome / totalCharges * 100).toFixed(1) : 0
        },
        monthlyData: Object.values(monthlyData),
        expenseCategoryData,
        buildings: buildings.length,
        payments: payments.length,
        expenses: expenses.length
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

  return (
    <div className="container">
      <h1>Reports & Analytics</h1>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Generate Custom Report</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginTop: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : '📊 Generate Report'}
          </button>
        </div>
      </div>

      {reportData && (
        <>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #27ae60' }}>
              <div className="stat-label">Total Income</div>
              <div className="stat-value" style={{ color: '#27ae60' }}>
                KES {reportData.summary.totalIncome.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #e74c3c' }}>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value" style={{ color: '#e74c3c' }}>
                KES {reportData.summary.totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #3498db' }}>
              <div className="stat-label">Net Income</div>
              <div className="stat-value" style={{ color: reportData.summary.netIncome >= 0 ? '#27ae60' : '#e74c3c' }}>
                KES {reportData.summary.netIncome.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #f39c12' }}>
              <div className="stat-label">Collection Rate</div>
              <div className="stat-value">{reportData.summary.collectionRate}%</div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
            <div className="card">
              <h3>Income vs Expenses (Monthly)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#27ae60" name="Income" />
                  <Bar dataKey="expenses" fill="#e74c3c" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '1rem' }}
                onClick={() => exportToCSV(reportData.monthlyData, 'monthly_report')}
              >
                📥 Export CSV
              </button>
            </div>

            <div className="card">
              <h3>Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '1rem' }}
                onClick={() => exportToCSV(reportData.expenseCategoryData, 'expense_categories')}
              >
                📥 Export CSV
              </button>
            </div>
          </div>
        </>
      )}

      {expiringLeases.length > 0 && (
        <div className="card">
          <h3>⚠️ Leases Expiring Soon (Next 60 Days)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Unit</th>
                <th>Building</th>
                <th>End Date</th>
                <th>Days Remaining</th>
              </tr>
            </thead>
            <tbody>
              {expiringLeases.map(lease => {
                const daysRemaining = Math.ceil((new Date(lease.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={lease.id}>
                    <td>{lease.tenant_name}</td>
                    <td>{lease.unit_number}</td>
                    <td>{lease.building_name}</td>
                    <td>{new Date(lease.end_date).toLocaleDateString()}</td>
                    <td style={{ 
                      fontWeight: 'bold',
                      color: daysRemaining <= 30 ? '#e74c3c' : '#f39c12'
                    }}>
                      {daysRemaining} days
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: '1rem' }}
            onClick={() => exportToCSV(expiringLeases, 'expiring_leases')}
          >
            📥 Export CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default Reports;
