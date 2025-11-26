"""
Transactions API Router
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional

from models.schemas import Transaction, TransactionCreate, TransactionUpdate, MessageResponse, CategorySuggestionRequest, CategorySuggestion
from database.db import execute_query, execute_insert, execute_update
from services.ai_categorization_service import suggest_category

router = APIRouter()


@router.post("/suggest-category", response_model=CategorySuggestion)
async def suggest_transaction_category(request: CategorySuggestionRequest):
    """AI-powered category suggestion"""
    if not request.description or request.description.strip() == "":
        raise HTTPException(status_code=400, detail="Description is required")
    
    try:
        suggestion = await suggest_category(request.description)
        return suggestion
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Transaction])
async def get_transactions(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    categoryId: Optional[int] = None
):
    """Get all transactions with optional filters"""
    sql = """
        SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE 1=1
    """
    params = []
    
    if startDate:
        sql += " AND t.date >= ?"
        params.append(startDate)
    if endDate:
        sql += " AND t.date <= ?"
        params.append(endDate)
    if categoryId:
        sql += " AND t.category_id = ?"
        params.append(categoryId)
    
    sql += " ORDER BY t.date DESC, t.created_at DESC"
    
    transactions = execute_query(sql, tuple(params))
    return transactions


@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: int):
    """Get transaction by ID"""
    sql = """
        SELECT t.*, c.name as category_name, c.type as category_type
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
    """
    transaction = execute_query(sql, (transaction_id,), fetch_one=True)
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction


@router.post("/", response_model=Transaction, status_code=201)
async def create_transaction(transaction: TransactionCreate):
    """Create a new transaction"""
    sql = """
        INSERT INTO transactions (amount, currency, category_id, description, date, is_recurring, recurrence_interval)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    transaction_id = execute_insert(
        sql,
        (
            transaction.amount,
            transaction.currency,
            transaction.category_id,
            transaction.description,
            transaction.date,
            transaction.is_recurring,
            transaction.recurrence_interval
        )
    )
    
    return {
        "id": transaction_id,
        "amount": transaction.amount,
        "currency": transaction.currency,
        "category_id": transaction.category_id,
        "description": transaction.description,
        "date": transaction.date,
        "is_recurring": transaction.is_recurring,
        "recurrence_interval": transaction.recurrence_interval
    }


@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: int, transaction: TransactionUpdate):
    """Update a transaction"""
    sql = """
        UPDATE transactions 
        SET amount = ?, currency = ?, category_id = ?, description = ?, date = ?, is_recurring = ?, recurrence_interval = ?
        WHERE id = ?
    """
    rows_affected = execute_update(
        sql,
        (
            transaction.amount,
            transaction.currency,
            transaction.category_id,
            transaction.description,
            transaction.date,
            transaction.is_recurring,
            transaction.recurrence_interval,
            transaction_id
        )
    )
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {
        "id": transaction_id,
        "amount": transaction.amount,
        "currency": transaction.currency,
        "category_id": transaction.category_id,
        "description": transaction.description,
        "date": transaction.date,
        "is_recurring": transaction.is_recurring,
        "recurrence_interval": transaction.recurrence_interval
    }


@router.delete("/{transaction_id}", response_model=MessageResponse)
async def delete_transaction(transaction_id: int):
    """Delete a transaction"""
    sql = "DELETE FROM transactions WHERE id = ?"
    rows_affected = execute_update(sql, (transaction_id,))
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {"message": "Transaction deleted successfully"}
