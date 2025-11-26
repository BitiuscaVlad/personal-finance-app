import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Budgets from './pages/Budgets';
import Bills from './pages/Bills';
import Transactions from './pages/Transactions';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/transactions" element={<Transactions />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
