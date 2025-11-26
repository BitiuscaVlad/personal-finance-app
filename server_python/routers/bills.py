"""
Bills API Router
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional

from models.schemas import Bill, BillCreate, BillUpdate, MessageResponse
from database.db import execute_query, execute_insert, execute_update

router = APIRouter()


@router.get("/", response_model=List[Bill])
async def get_bills(status: Optional[str] = None, upcoming: Optional[bool] = None):
    """Get all bills with optional filters"""
    sql = """
        SELECT b.*, c.name as category_name, c.color as category_color
        FROM bills b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE 1=1
    """
    params = []
    
    if status:
        sql += " AND b.status = ?"
        params.append(status)
    
    if upcoming:
        sql += ' AND date(b.due_date) BETWEEN date("now") AND date("now", "+7 days")'
    
    sql += " ORDER BY b.due_date ASC"
    
    bills = execute_query(sql, tuple(params))
    return bills


@router.get("/{bill_id}", response_model=Bill)
async def get_bill(bill_id: int):
    """Get bill by ID"""
    sql = """
        SELECT b.*, c.name as category_name
        FROM bills b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.id = ?
    """
    bill = execute_query(sql, (bill_id,), fetch_one=True)
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    return bill


@router.post("/", response_model=Bill, status_code=201)
async def create_bill(bill: BillCreate):
    """Create a new bill"""
    sql = """
        INSERT INTO bills (name, amount, currency, due_date, category_id, is_recurring, recurrence_interval, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    bill_id = execute_insert(
        sql,
        (
            bill.name,
            bill.amount,
            bill.currency,
            bill.due_date,
            bill.category_id,
            bill.is_recurring,
            bill.recurrence_interval,
            bill.status
        )
    )
    
    return {
        "id": bill_id,
        "name": bill.name,
        "amount": bill.amount,
        "currency": bill.currency,
        "due_date": bill.due_date,
        "category_id": bill.category_id,
        "is_recurring": bill.is_recurring,
        "recurrence_interval": bill.recurrence_interval,
        "status": bill.status
    }


@router.put("/{bill_id}", response_model=Bill)
async def update_bill(bill_id: int, bill: BillUpdate):
    """Update a bill"""
    sql = """
        UPDATE bills 
        SET name = ?, amount = ?, currency = ?, due_date = ?, category_id = ?, is_recurring = ?, recurrence_interval = ?, status = ?
        WHERE id = ?
    """
    rows_affected = execute_update(
        sql,
        (
            bill.name,
            bill.amount,
            bill.currency,
            bill.due_date,
            bill.category_id,
            bill.is_recurring,
            bill.recurrence_interval,
            bill.status,
            bill_id
        )
    )
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    return {
        "id": bill_id,
        "name": bill.name,
        "amount": bill.amount,
        "currency": bill.currency,
        "due_date": bill.due_date,
        "category_id": bill.category_id,
        "is_recurring": bill.is_recurring,
        "recurrence_interval": bill.recurrence_interval,
        "status": bill.status
    }


@router.patch("/{bill_id}/pay", response_model=MessageResponse)
async def mark_bill_paid(bill_id: int):
    """Mark bill as paid"""
    sql = 'UPDATE bills SET status = "paid" WHERE id = ?'
    rows_affected = execute_update(sql, (bill_id,))
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    return {"message": "Bill marked as paid"}


@router.delete("/{bill_id}", response_model=MessageResponse)
async def delete_bill(bill_id: int):
    """Delete a bill"""
    sql = "DELETE FROM bills WHERE id = ?"
    rows_affected = execute_update(sql, (bill_id,))
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    return {"message": "Bill deleted successfully"}
