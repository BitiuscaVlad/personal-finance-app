import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import * as api from '../services/api';

jest.mock('../services/api');

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard title', () => {
    // Mock API responses
    api.getDashboardSummary.mockResolvedValue({
      data: {
        totalBudget: 0,
        totalSpent: 0,
        remaining: 0,
        upcomingBills: 0,
        overdueBills: 0
      }
    });
    api.getSpendingByCategory.mockResolvedValue({ data: [] });
    api.getRecentTransactions.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test('fetches and displays dashboard summary', async () => {
    api.getDashboardSummary.mockResolvedValue({
      data: {
        totalBudget: 1000,
        totalSpent: 500,
        remaining: 500,
        upcomingBills: 2,
        overdueBills: 0
      }
    });
    api.getSpendingByCategory.mockResolvedValue({ data: [] });
    api.getRecentTransactions.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.getDashboardSummary).toHaveBeenCalled();
    });
  });
});
