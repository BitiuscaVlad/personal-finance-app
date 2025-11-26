import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getDashboardSummary, getSpendingByCategory, getRecentTransactions, getBills } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [spendingData, setSpendingData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, spendingRes, transactionsRes, billsRes] = await Promise.all([
        getDashboardSummary(),
        getSpendingByCategory(),
        getRecentTransactions(5),
        getBills({ upcoming: true })
      ]);

      setSummary(summaryRes.data);
      setSpendingData(spendingRes.data);
      setRecentTransactions(transactionsRes.data);
      setUpcomingBills(billsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const budgetPercentage = summary?.totalBudget > 0 
    ? (summary.totalSpent / summary.totalBudget) * 100 
    : 0;

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Budget</h3>
          <p className="amount">{formatCurrency(summary?.totalBudget || 0)}</p>
          <span className="label">This month</span>
        </div>

        <div className="summary-card">
          <h3>Total Spent</h3>
          <p className="amount spent">{formatCurrency(summary?.totalSpent || 0)}</p>
          <span className="label">{budgetPercentage.toFixed(1)}% of budget</span>
        </div>

        <div className="summary-card">
          <h3>Remaining</h3>
          <p className={`amount ${summary?.remaining < 0 ? 'negative' : 'positive'}`}>
            {formatCurrency(summary?.remaining || 0)}
          </p>
          <span className="label">Available to spend</span>
        </div>

        <div className="summary-card">
          <h3>Upcoming Bills</h3>
          <p className="amount bills">{summary?.upcomingBills || 0}</p>
          <span className="label">Next 7 days</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Spending Chart */}
        <div className="dashboard-section chart-section">
          <h2>Spending by Category</h2>
          {spendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingData}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${formatCurrency(entry.total)}`}
                >
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">No spending data for this month</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="dashboard-section">
          <h2>Recent Transactions</h2>
          {recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <div 
                      className="category-dot" 
                      style={{ backgroundColor: transaction.category_color }}
                    ></div>
                    <div>
                      <p className="transaction-description">
                        {transaction.description || transaction.category_name}
                      </p>
                      <span className="transaction-date">{formatDate(transaction.date)}</span>
                    </div>
                  </div>
                  <p className={`transaction-amount ${transaction.category_type === 'income' ? 'income' : 'expense'}`}>
                    {transaction.category_type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No recent transactions</p>
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="dashboard-section">
          <h2>Upcoming Bills</h2>
          {upcomingBills.length > 0 ? (
            <div className="bills-list">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="bill-item">
                  <div className="bill-info">
                    <div 
                      className="category-dot" 
                      style={{ backgroundColor: bill.category_color }}
                    ></div>
                    <div>
                      <p className="bill-name">{bill.name}</p>
                      <span className="bill-date">Due: {formatDate(bill.due_date)}</span>
                    </div>
                  </div>
                  <p className="bill-amount">{formatCurrency(bill.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No upcoming bills</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
