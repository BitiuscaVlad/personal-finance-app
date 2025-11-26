"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date, datetime


# Category models
class CategoryBase(BaseModel):
    name: str
    type: Literal["income", "expense"]
    color: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Transaction models
class TransactionBase(BaseModel):
    amount: float
    currency: str = "RON"
    category_id: Optional[int] = None
    description: Optional[str] = None
    date: date
    is_recurring: bool = False
    recurrence_interval: Optional[Literal["daily", "weekly", "monthly", "yearly"]] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: int
    created_at: Optional[datetime] = None
    category_name: Optional[str] = None
    category_type: Optional[str] = None
    category_color: Optional[str] = None

    class Config:
        from_attributes = True


# Budget models
class BudgetBase(BaseModel):
    category_id: int
    amount: float
    currency: str = "RON"
    month: int = Field(..., ge=1, le=12)
    year: int


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BudgetBase):
    pass


class Budget(BudgetBase):
    id: int
    created_at: Optional[datetime] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None

    class Config:
        from_attributes = True


class BudgetWithSpending(Budget):
    budgeted: float
    spent: float


# Bill models
class BillBase(BaseModel):
    name: str
    amount: float
    currency: str = "RON"
    due_date: date
    category_id: Optional[int] = None
    is_recurring: bool = False
    recurrence_interval: Optional[Literal["monthly", "yearly"]] = None
    status: Literal["pending", "paid"] = "pending"


class BillCreate(BillBase):
    pass


class BillUpdate(BillBase):
    pass


class Bill(BillBase):
    id: int
    created_at: Optional[datetime] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None

    class Config:
        from_attributes = True


# Dashboard models
class DashboardSummary(BaseModel):
    totalBudget: float
    totalSpent: float
    remaining: float
    upcomingBills: int
    overdueBills: int
    month: int
    year: int


class SpendingByCategory(BaseModel):
    name: str
    color: str
    total: float


class RecentTransaction(Transaction):
    pass


# Currency models
class CurrencyRates(BaseModel):
    rates: dict[str, float]
    date: str
    source: str
    baseCurrency: str = "RON"


class CurrencyConvertRequest(BaseModel):
    amount: float
    fromCurrency: str
    toCurrency: str


class CurrencyConvertResponse(BaseModel):
    originalAmount: float
    fromCurrency: str
    toCurrency: str
    convertedAmount: float
    timestamp: str


class CurrencyPreference(BaseModel):
    displayCurrency: str


class Currency(BaseModel):
    code: str
    name: str


# AI Categorization models
class CategorySuggestionRequest(BaseModel):
    description: str


class CategorySuggestion(BaseModel):
    categoryId: int
    categoryName: str
    confidence: Literal["low", "medium", "high"]
    reasoning: str


# Generic response models
class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    error: str
