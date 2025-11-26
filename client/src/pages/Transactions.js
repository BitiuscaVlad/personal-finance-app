import React, { useState, useEffect, useCallback } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getCategories, suggestCategory } from '../services/api';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState('all'); // all, income, expense
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurrence_interval: 'monthly',
  });

  useEffect(() => {
    loadCategories();
    loadTransactions();
  }, []);

  // Debounced function to get AI category suggestion
  const getSuggestion = useCallback(async (description) => {
    if (!description || description.trim().length < 3) {
      setAiSuggestion(null);
      return;
    }

    setLoadingSuggestion(true);
    try {
      const response = await suggestCategory(description);
      setAiSuggestion(response.data);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      setAiSuggestion(null);
    } finally {
      setLoadingSuggestion(false);
    }
  }, []);

  // Debounce the AI suggestion call
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description && !editingTransaction) {
        getSuggestion(formData.description);
      }
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timer);
  }, [formData.description, editingTransaction, getSuggestion]);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await getTransactions();
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const transactionData = {
        ...formData,
        is_recurring: formData.is_recurring ? 1 : 0,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionData);
      } else {
        await createTransaction(transactionData);
      }

      setShowModal(false);
      setEditingTransaction(null);
      resetForm();
      loadTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert(error.response?.data?.error || 'Error saving transaction');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount,
      category_id: transaction.category_id,
      description: transaction.description || '',
      date: transaction.date,
      is_recurring: transaction.is_recurring === 1,
      recurrence_interval: transaction.recurrence_interval || 'monthly',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        loadTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category_id: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      recurrence_interval: 'monthly',
    });
    setAiSuggestion(null);
  };

  const acceptAiSuggestion = () => {
    if (aiSuggestion) {
      setFormData({ ...formData, category_id: aiSuggestion.categoryId });
      setAiSuggestion(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.category_type === filter;
  });

  const totalIncome = transactions
    .filter(t => t.category_type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.category_type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="transactions">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Transaction
        </button>
      </div>

      {/* Summary */}
      <div className="transaction-summary">
        <div className="summary-item income">
          <span className="label">Total Income</span>
          <p className="amount">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="summary-item expense">
          <span className="label">Total Expenses</span>
          <p className="amount">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="summary-item balance">
          <span className="label">Net Balance</span>
          <p className={`amount ${netBalance >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({transactions.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'income' ? 'active' : ''}`}
          onClick={() => setFilter('income')}
        >
          Income ({transactions.filter(t => t.category_type === 'income').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'expense' ? 'active' : ''}`}
          onClick={() => setFilter('expense')}
        >
          Expenses ({transactions.filter(t => t.category_type === 'expense').length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : filteredTransactions.length > 0 ? (
        <div className="transactions-list">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className={`transaction-card ${transaction.category_type}`}>
              <div className="transaction-main">
                <div className="transaction-info">
                  <div 
                    className="category-dot" 
                    style={{ backgroundColor: transaction.category_color }}
                  ></div>
                  <div>
                    <h3 className="transaction-description">
                      {transaction.description || transaction.category_name}
                      {transaction.is_recurring && <span className="recurring-badge">🔁</span>}
                    </h3>
                    <p className="transaction-meta">
                      {transaction.category_name} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                <div className="transaction-details">
                  <p className={`transaction-amount ${transaction.category_type}`}>
                    {transaction.category_type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>

              <div className="transaction-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleEdit(transaction)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(transaction.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No transactions found</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add Your First Transaction
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditingTransaction(null);
          resetForm();
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  <optgroup label="Income">
                    {categories.filter(c => c.type === 'income').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Expenses">
                    {categories.filter(c => c.type === 'expense').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
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
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Grocery shopping at Walmart"
                />
                
                {/* AI Suggestion */}
                {loadingSuggestion && (
                  <div className="ai-suggestion loading">
                    <span className="ai-icon">🤖</span>
                    <span>Analyzing description...</span>
                  </div>
                )}
                
                {aiSuggestion && !formData.category_id && !loadingSuggestion && (
                  <div className="ai-suggestion">
                    <div className="suggestion-header">
                      <span className="ai-icon">🤖</span>
                      <span className="suggestion-text">
                        AI suggests: <strong>{aiSuggestion.categoryName}</strong>
                      </span>
                      <span className={`confidence-badge ${aiSuggestion.confidence}`}>
                        {aiSuggestion.confidence}
                      </span>
                    </div>
                    <p className="suggestion-reason">{aiSuggestion.reasoning}</p>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-primary"
                      onClick={acceptAiSuggestion}
                    >
                      Accept Suggestion
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                  Recurring Transaction
                </label>
              </div>

              {formData.is_recurring && (
                <div className="form-group">
                  <label>Recurrence</label>
                  <select
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
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
                    setEditingTransaction(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
