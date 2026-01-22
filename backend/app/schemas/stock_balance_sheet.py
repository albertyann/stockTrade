from pydantic import BaseModel
from datetime import date
from typing import Optional, Dict, Any


class StockBalanceSheetBase(BaseModel):
    stock_id: Optional[int] = None
    ts_code: Optional[str] = None
    fiscal_date_ending: Optional[date] = None
    reported_currency: Optional[str] = None
    total_assets: Optional[float] = None
    total_current_assets: Optional[float] = None
    cash_and_cash_equivalents_at_carrying_value: Optional[float] = None
    cash_and_short_term_investments: Optional[float] = None
    total_non_current_assets: Optional[float] = None
    property_plant_equipment: Optional[float] = None
    total_liabilities: Optional[float] = None
    total_current_liabilities: Optional[float] = None
    current_long_term_debt: Optional[float] = None
    long_term_debt: Optional[float] = None
    total_non_current_liabilities: Optional[float] = None
    total_shareholder_equity: Optional[float] = None
    treasury_stock: Optional[float] = None
    retained_earnings: Optional[float] = None
    common_shares_outstanding: Optional[float] = None
    raw_data: Optional[Dict[str, Any]] = None


class StockBalanceSheetCreate(StockBalanceSheetBase):
    pass


class StockBalanceSheetUpdate(BaseModel):
    total_assets: Optional[float] = None
    total_current_assets: Optional[float] = None
    cash_and_cash_equivalents_at_carrying_value: Optional[float] = None
    cash_and_short_term_investments: Optional[float] = None
    total_non_current_assets: Optional[float] = None
    property_plant_equipment: Optional[float] = None
    total_liabilities: Optional[float] = None
    total_current_liabilities: Optional[float] = None
    current_long_term_debt: Optional[float] = None
    long_term_debt: Optional[float] = None
    total_non_current_liabilities: Optional[float] = None
    total_shareholder_equity: Optional[float] = None
    treasury_stock: Optional[float] = None
    retained_earnings: Optional[float] = None
    common_shares_outstanding: Optional[float] = None
    raw_data: Optional[Dict[str, Any]] = None


class StockBalanceSheetResponse(StockBalanceSheetBase):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
