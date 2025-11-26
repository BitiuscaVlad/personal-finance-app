import React, { useState, useEffect } from 'react';
import { getBills, createBill, updateBill, deleteBill, payBill, getCategories } from '../services/api';
import './Bills.css';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, paid
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    due_date: '',
    category_id: '',
    is_recurring: false,
    recurrence_interval: 'monthly',
  });

  useEffect(() => {
    loadCategories();
    loadBills();
  }, [filter]);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data.filter(cat => cat.type === 'expense'));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBills = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await getBills(params);
      setBills(response.data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const billData = {
        ...formData,
        is_recurring: formData.is_recurring ? 1 : 0,
      };

      if (editingBill) {
        await updateBill(editingBill.id, billData);
      } else {
        await createBill(billData);
      }

      setShowModal(false);
      setEditingBill(null);
      resetForm();
      loadBills();
    } catch (error) {
      console.error('Error saving bill:', error);
      alert(error.response?.data?.error || 'Error saving bill');
    }
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setFormData({
      name: bill.name,
      amount: bill.amount,
      due_date: bill.due_date,
      category_id: bill.category_id,
      is_recurring: bill.is_recurring === 1,
      recurrence_interval: bill.recurrence_interval || 'monthly',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await deleteBill(id);
        loadBills();
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    }
  };

  const handlePayBill = async (id) => {
    try {
      await payBill(id);
      loadBills();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      due_date: '',
      category_id: '',
      is_recurring: false,
      recurrence_interval: 'monthly',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBillStatus = (bill) => {
    if (bill.status === 'paid') return 'paid';
    const daysUntil = getDaysUntilDue(bill.due_date);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'upcoming';
    return 'pending';
  };

  const getStatusLabel = (bill) => {
    const status = getBillStatus(bill);
    const daysUntil = getDaysUntilDue(bill.due_date);
    
    if (status === 'paid') return 'Paid';
    if (status === 'overdue') return `Overdue (${Math.abs(daysUntil)} days)`;
    if (status === 'upcoming') return `Due in ${daysUntil} days`;
    return 'Pending';
  };

  return (
    <div className="bills">
      <div className="page-header">
        <h1 className="page-title">Bills</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Bill
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Bills
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
          onClick={() => setFilter('paid')}
        >
          Paid
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading bills...</div>
      ) : bills.length > 0 ? (
        <div className="bills-list">
          {bills.map((bill) => {
            const status = getBillStatus(bill);
            
            return (
              <div key={bill.id} className={`bill-card ${status}`}>
                <div className="bill-main">
                  <div className="bill-info">
                    <div 
                      className="category-dot" 
                      style={{ backgroundColor: bill.category_color }}
                    ></div>
                    <div>
                      <h3 className="bill-name">
                        {bill.name}
                        {bill.is_recurring && <span className="recurring-badge">🔁 Recurring</span>}
                      </h3>
                      <p className="bill-category">{bill.category_name}</p>
                    </div>
                  </div>

                  <div className="bill-details">
                    <p className="bill-amount">{formatCurrency(bill.amount)}</p>
                    <p className="bill-due-date">Due: {formatDate(bill.due_date)}</p>
                    <span className={`status-badge ${status}`}>
                      {getStatusLabel(bill)}
                    </span>
                  </div>
                </div>

                <div className="bill-actions">
                  {bill.status === 'pending' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => handlePayBill(bill.id)}
                    >
                      Mark as Paid
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleEdit(bill)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(bill.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>No bills found</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add Your First Bill
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditingBill(null);
          resetForm();
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBill ? 'Edit Bill' : 'Add Bill'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Bill Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Electric Bill, Rent"
                />
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                  Recurring Bill
                </label>
              </div>

              {formData.is_recurring && (
                <div className="form-group">
                  <label>Recurrence</label>
                  <select
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBill(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBill ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
