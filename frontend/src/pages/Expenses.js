import React, { useState, useEffect } from 'react';
import { expensesAPI, buildingsAPI } from '../services/api';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    building: '',
    unit: '',
    category: 'MAINTENANCE',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    receipt_number: '',
    notes: '',
    paid: true
  });

  useEffect(() => {
    fetchExpenses();
    fetchBuildings();
    fetchSummary();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expensesAPI.getAll();
      const data = response.data.results || response.data;
      setExpenses(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      const data = response.data.results || response.data;
      setBuildings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await expensesAPI.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.building) delete submitData.building;
      if (!submitData.unit) delete submitData.unit;
      if (!submitData.vendor) delete submitData.vendor;
      if (!submitData.receipt_number) delete submitData.receipt_number;
      if (!submitData.notes) delete submitData.notes;

      await expensesAPI.create(submitData);
      setShowModal(false);
      setFormData({
        building: '',
        unit: '',
        category: 'MAINTENANCE',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor: '',
        receipt_number: '',
        notes: '',
        paid: true
      });
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to create expense');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Expense Tracking</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Expense
        </button>
      </div>

      {summary && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #e74c3c' }}>
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value">KES {summary.total_expenses?.toLocaleString() || 0}</div>
          </div>
          {summary.by_category?.slice(0, 3).map((cat, idx) => (
            <div key={idx} className="stat-card" style={{ borderLeft: '4px solid #3498db' }}>
              <div className="stat-label">{cat.category}</div>
              <div className="stat-value">KES {cat.total?.toLocaleString() || 0}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        {expenses.length === 0 ? (
          <p>No expenses recorded.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Building</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td>{expense.category}</td>
                  <td>{expense.description}</td>
                  <td>{expense.building_name || 'General'}</td>
                  <td>{expense.vendor || '-'}</td>
                  <td style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                    KES {expense.amount.toLocaleString()}
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: expense.paid ? '#27ae60' : '#f39c12',
                      color: 'white',
                      fontSize: '0.85rem'
                    }}>
                      {expense.paid ? 'Paid' : 'Pending'}
                    </span>
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
              <h2>Add Expense</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category*</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="MAINTENANCE">Maintenance & Repairs</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="SALARIES">Salaries & Wages</option>
                  <option value="TAXES">Taxes & Fees</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="SUPPLIES">Supplies</option>
                  <option value="PROFESSIONAL">Professional Services</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description*</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (KES)*</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date*</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Building (optional)</label>
                <select
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                >
                  <option value="">General Expense</option>
                  {buildings.map(building => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vendor</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Receipt #</label>
                  <input
                    type="text"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.paid}
                    onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                  />
                  {' '}Paid
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
