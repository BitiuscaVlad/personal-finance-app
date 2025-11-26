"""
Categories API Router
"""
from fastapi import APIRouter, HTTPException
from typing import List

from models.schemas import Category, CategoryCreate, CategoryUpdate, MessageResponse
from database.db import execute_query, execute_insert, execute_update

router = APIRouter()


@router.get("/", response_model=List[Category])
async def get_categories():
    """Get all categories"""
    sql = "SELECT * FROM categories ORDER BY type, name"
    categories = execute_query(sql)
    return categories


@router.get("/{category_id}", response_model=Category)
async def get_category(category_id: int):
    """Get category by ID"""
    sql = "SELECT * FROM categories WHERE id = ?"
    category = execute_query(sql, (category_id,), fetch_one=True)
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category


@router.post("/", response_model=Category, status_code=201)
async def create_category(category: CategoryCreate):
    """Create a new category"""
    sql = "INSERT INTO categories (name, type, color) VALUES (?, ?, ?)"
    category_id = execute_insert(sql, (category.name, category.type, category.color))
    
    return {
        "id": category_id,
        "name": category.name,
        "type": category.type,
        "color": category.color
    }


@router.put("/{category_id}", response_model=Category)
async def update_category(category_id: int, category: CategoryUpdate):
    """Update a category"""
    sql = "UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?"
    rows_affected = execute_update(sql, (category.name, category.type, category.color, category_id))
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {
        "id": category_id,
        "name": category.name,
        "type": category.type,
        "color": category.color
    }


@router.delete("/{category_id}", response_model=MessageResponse)
async def delete_category(category_id: int):
    """Delete a category"""
    sql = "DELETE FROM categories WHERE id = ?"
    rows_affected = execute_update(sql, (category_id,))
    
    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}
