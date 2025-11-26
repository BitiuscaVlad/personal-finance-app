"""
Dashboard API Router
"""
from fastapi import APIRouter
from typing import List
from datetime import datetime

from models.schemas import DashboardSummary, SpendingByCategory, RecentTransaction
from database.db import execute_query

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary():
    """Get dashboard summary for current month"""
    current_date = datetime.now()
    current_month = current_date.month
    current_year = current_date.year
    
    # Total budget for current month
    budget_sql = "SELECT COALESCE(SUM(amount), 0) as total FROM budgets WHERE month = ? AND year = ?"
    budget_result = execute_query(budget_sql, (current_month, current_year), fetch_one=True)
    total_budget = budget_result["total"] if budget_result else 0
    
    # Total spent this month
    spent_sql = """
        SELECT COALESCE(SUM(t.amount), 0) as total 
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE c.type = 'expense' 
        AND strftime('%m', t.date) = printf('%02d', ?)
        AND strftime('%Y', t.date) = ?
    """
    spent_result = execute_query(spent_sql, (current_month, str(current_year)), fetch_one=True)
    total_spent = spent_result["total"] if spent_result else 0
    
    # Upcoming bills (next 7 days)
    upcoming_sql = """
        SELECT COUNT(*) as count FROM bills 
        WHERE status = 'pending' 
        AND date(due_date) BETWEEN date('now') AND date('now', '+7 days')
    """
    upcoming_result = execute_query(upcoming_sql, fetch_one=True)
    upcoming_bills = upcoming_result["count"] if upcoming_result else 0
    
    # Overdue bills
    overdue_sql = """
        SELECT COUNT(*) as count FROM bills 
        WHERE status = 'pending' 
        AND date(due_date) < date('now')
    """
    overdue_result = execute_query(overdue_sql, fetch_one=True)
    overdue_bills = overdue_result["count"] if overdue_result else 0
    
    return {
        "totalBudget": total_budget,
        "totalSpent": total_spent,
        "remaining": total_budget - total_spent,
        "upcomingBills": upcoming_bills,
        "overdueBills": overdue_bills,
        "month": current_month,
        "year": current_year
    }


@router.get("/spending-by-category", response_model=List[SpendingByCategory])
async def get_spending_by_category():
    """Get spending by category for current month"""
    current_date = datetime.now()
    current_month = current_date.month
    current_year = current_date.year
    
    sql = """
        SELECT 
            c.name,
            c.color,
            COALESCE(SUM(t.amount), 0) as total
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id
            AND strftime('%m', t.date) = printf('%02d', ?)
            AND strftime('%Y', t.date) = ?
        WHERE c.type = 'expense'
        GROUP BY c.id, c.name, c.color
        HAVING total > 0
        ORDER BY total DESC
    """
    
    spending = execute_query(sql, (current_month, str(current_year)))
    return spending


@router.get("/recent-transactions", response_model=List[RecentTransaction])
async def get_recent_transactions(limit: int = 5):
    """Get recent transactions"""
    sql = """
        SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT ?
    """
    
    transactions = execute_query(sql, (limit,))
    return transactions
