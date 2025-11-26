"""
Budgets API Router
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional

from models.schemas import Budget, BudgetCreate, BudgetUpdate, BudgetWithSpending, MessageResponse
from database.db import execute_query, execute_insert, execute_update

router = APIRouter()


@router.get("/", response_model=List[Budget])
async def get_budgets(month: Optional[int] = None, year: Optional[int] = None):
    """Get all budgets with optional filters"""
    sql = """
        SELECT b.*, c.name as category_name, c.color as category_color
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE 1=1
    """
    params = []
    
    if month is not None:
        sql += " AND b.month = ?"
        params.append(month)
    if year is not None:
        sql += " AND b.year = ?"
        params.append(year)
    
    sql += " ORDER BY c.name"
    
    budgets = execute_query(sql, tuple(params))
    return budgets


@router.get("/{budget_id}", response_model=Budget)
async def get_budget(budget_id: int):
    """Get budget by ID"""
    sql = """
        SELECT b.*, c.name as category_name
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.id = ?
    """
    budget = execute_query(sql, (budget_id,), fetch_one=True)
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return budget


@router.get("/spending/{month}/{year}", response_model=List[BudgetWithSpending])
async def get_budget_with_spending(month: int, year: int):
    """Get budgets with spending for a specific month and year"""
    sql = """
        SELECT 
            b.id,
            b.category_id,
            b.amount as budgeted,
            c.name as category_name,
            c.color as category_color,
            COALESCE(SUM(t.amount), 0) as spent,
            b.month,
            b.year,
            b.currency,
            b.amount
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = b.category_id 
            AND strftime('%m', t.date) = printf('%02d', b.month)
            AND strftime('%Y', t.date) = CAST(b.year AS TEXT)
            AND c.type = 'expense'
        WHERE b.month = ? AND b.year = ?
        GROUP BY b.id, b.category_id, b.amount, c.name, c.color, b.month, b.year
        ORDER BY c.name
    """
    
    budgets = execute_query(sql, (month, year))
    return budgets


@router.post("/", response_model=Budget, status_code=201)
async def create_budget(budget: BudgetCreate):
    """Create a new budget"""
    sql = "INSERT INTO budgets (category_id, amount, currency, month, year) VALUES (?, ?, ?, ?, ?)"
    
    try:
        budget_id = execute_insert(
            sql,
            (budget.category_id, budget.amount, budget.currency, budget.month, budget.year)
        )
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Budget already exists for this category and month"
            )
        raise HTTPException(status_code=500, detail=str(e))
    
    return {
        "id": budget_id,
        "category_id": budget.category_id,
        "amount": budget.amount,
        "currency": budget.currency,
        "month": budget.month,
        "year": budget.year
    }


@router.put("/{budget_id}", response_model=Budget)
async def update_budget(budget_id: int, budget: BudgetUpdate):
    """Update a budget"""
    sql = "UPDATE budgets SET category_id = ?, amount = ?, currency = ?, month = ?, year = ? WHERE id = ?"
    rows_affected = execute_update(
        sql,
        (budget.category_id, budget.amount, budget.currency, budget.month, budget.year, budget_id)
    )
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return {
        "id": budget_id,
        "category_id": budget.category_id,
        "amount": budget.amount,
        "currency": budget.currency,
        "month": budget.month,
        "year": budget.year
    }


@router.delete("/{budget_id}", response_model=MessageResponse)
async def delete_budget(budget_id: int):
    """Delete a budget"""
    sql = "DELETE FROM budgets WHERE id = ?"
    rows_affected = execute_update(sql, (budget_id,))
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return {"message": "Budget deleted successfully"}
