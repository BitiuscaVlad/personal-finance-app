import React from 'react';
import { NavLink } from 'react-router-dom';
import CurrencySelector from './CurrencySelector';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <h1 className="navbar-brand">💰 Finance App</h1>
          <ul className="navbar-menu">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/budgets" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Budgets
              </NavLink>
            </li>
            <li>
              <NavLink to="/bills" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Bills
              </NavLink>
            </li>
            <li>
              <NavLink to="/transactions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Transactions
              </NavLink>
            </li>
          </ul>
          <CurrencySelector />
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
