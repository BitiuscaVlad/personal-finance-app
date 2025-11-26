import React, { useState, useEffect } from 'react';
import { getBudgetSpending, createBudget, updateBudget, deleteBudget, getCategories } from '../services/api';
import './Budgets.css';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
  });

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadBudgets();
    }
  }, [selectedMonth, selectedYear, categories]);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data.filter(cat => cat.type === 'expense'));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const response = await getBudgetSpending(selectedMonth, selectedYear);
      setBudgets(response.data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const budgetData = {
        ...formData,
        month: selectedMonth,
        year: selectedYear,
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData);
      } else {
        await createBudget(budgetData);
      }

      setShowModal(false);
      setEditingBudget(null);
      setFormData({ category_id: '', amount: '' });
      loadBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert(error.response?.data?.error || 'Error saving budget');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.budgeted,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
        loadBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgress = (spent, budgeted) => {
    if (budgeted === 0) return 0;
    return Math.min((spent / budgeted) * 100, 100);
  };

  const getProgressColor = (spent, budgeted) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 80) return '#f59e0b';
    return '#10b981';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="budgets">
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Budget
        </button>
      </div>

      {/* Month/Year Selector */}
      <div className="month-selector">
        <button 
          className="btn btn-secondary"
          onClick={() => {
            if (selectedMonth === 1) {
              setSelectedMonth(12);
              setSelectedYear(selectedYear - 1);
            } else {
              setSelectedMonth(selectedMonth - 1);
            }
          }}
        >
          ← Previous
        </button>
        <h2>{monthNames[selectedMonth - 1]} {selectedYear}</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => {
            if (selectedMonth === 12) {
              setSelectedMonth(1);
              setSelectedYear(selectedYear + 1);
            } else {
              setSelectedMonth(selectedMonth + 1);
            }
          }}
        >
          Next →
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading budgets...</div>
      ) : budgets.length > 0 ? (
        <div className="budgets-grid">
          {budgets.map((budget) => {
            const progress = getProgress(budget.spent, budget.budgeted);
            const progressColor = getProgressColor(budget.spent, budget.budgeted);
            const remaining = budget.budgeted - budget.spent;

            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-header">
                  <div className="budget-category">
                    <div 
                      className="category-dot" 
                      style={{ backgroundColor: budget.category_color }}
                    ></div>
                    <h3>{budget.category_name}</h3>
                  </div>
                  <div className="budget-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEdit(budget)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDelete(budget.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="budget-amounts">
                  <div>
                    <span className="label">Spent</span>
                    <p className="amount spent">{formatCurrency(budget.spent)}</p>
                  </div>
                  <div>
                    <span className="label">Budget</span>
                    <p className="amount">{formatCurrency(budget.budgeted)}</p>
                  </div>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: progressColor
                    }}
                  ></div>
                </div>

                <div className="budget-footer">
                  <span className={remaining >= 0 ? 'remaining' : 'over-budget'}>
                    {remaining >= 0 
                      ? `${formatCurrency(remaining)} remaining` 
                      : `${formatCurrency(Math.abs(remaining))} over budget`}
                  </span>
                  <span className="percentage">{progress.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>No budgets set for this month</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create Your First Budget
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditingBudget(null);
          setFormData({ category_id: '', amount: '' });
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBudget ? 'Edit Budget' : 'Add Budget'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                  disabled={editingBudget}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount</label>
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

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBudget(null);
                    setFormData({ category_id: '', amount: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
