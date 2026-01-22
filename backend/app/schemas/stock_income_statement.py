from pydantic import BaseModel
from datetime import date
from typing import Optional, Dict, Any


class StockIncomeStatementBase(BaseModel):
    stock_id: Optional[int] = None
    ts_code: Optional[str] = None
    fiscal_date_ending: Optional[date] = None
    reported_currency: Optional[str] = None
    total_revenue: Optional[float] = None
    cost_of_revenue: Optional[float] = None
    gross_profit: Optional[float] = None
    total_operating_expenses: Optional[float] = None
    operating_income: Optional[float] = None
    interest_expense: Optional[float] = None
    income_before_tax: Optional[float] = None
    income_tax_expense: Optional[float] = None
    net_income: Optional[float] = None
    ebit: Optional[float] = None
    ebitda: Optional[float] = None
    net_income_from_continuing_operations: Optional[float] = None
    comprehensive_income_net_of_tax: Optional[float] = None
    raw_data: Optional[Dict[str, Any]] = None


class StockIncomeStatementCreate(StockIncomeStatementBase):
    pass


class StockIncomeStatementUpdate(BaseModel):
    total_revenue: Optional[float] = None
    cost_of_revenue: Optional[float] = None
    gross_profit: Optional[float] = None
    total_operating_expenses: Optional[float] = None
    operating_income: Optional[float] = None
    interest_expense: Optional[float] = None
    income_before_tax: Optional[float] = None
    income_tax_expense: Optional[float] = None
    net_income: Optional[float] = None
    ebit: Optional[float] = None
    ebitda: Optional[float] = None
    net_income_from_continuing_operations: Optional[float] = None
    comprehensive_income_net_of_tax: Optional[float] = None
    raw_data: Optional[Dict[str, Any]] = None


class StockIncomeStatementResponse(StockIncomeStatementBase):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
