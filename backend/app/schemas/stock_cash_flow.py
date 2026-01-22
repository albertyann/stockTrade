from pydantic import BaseModel
from datetime import date
from typing import Optional, Dict, Any


class StockCashFlowBase(BaseModel):
    stock_id: Optional[int] = None
    ts_code: Optional[str] = None
    fiscal_date_ending: Optional[date] = None
    reported_currency: Optional[str] = None
    operating_cashflow: Optional[float] = None
    payments_for_operating_activities: Optional[float] = None
    proceeds_from_operating_activities: Optional[float] = None
    depreciation_amortization: Optional[float] = None
    stock_based_compensation: Optional[float] = None
    operating_cashflow_continuing: Optional[float] = None
    capital_expenditures: Optional[float] = None
    capital_expenditure_for_property_plant_equipment: Optional[float] = None
    proceeds_from_sale_of_property_plant_equipment: Optional[float] = None
    investment_purchase_and_sale: Optional[float] = None
    sale_purchase_of_investment: Optional[float] = None
    net_borrowings: Optional[float] = None
    other_financing_activities: Optional[float] = None
    cash_flow_from_financing: Optional[float] = None
    dividends_paid: Optional[float] = None
    free_cash_flow: Optional[float] = None
    raw_data: Optional[Dict[str, Any]] = None


class StockCashFlowCreate(StockCashFlowBase):
    pass


class StockCashFlowUpdate(BaseModel):
    operating_cashflow: Optional[float] = None
    payments_for_operating_activities: Optional[float] = None
    proceeds_from_operating_activities: Optional[float] = None
    depreciation_amortization: Optional[float] = None
    stock_based_compensation: Optional[float] = None
    operating_cashflow_continuing: Optional[float] = None
    capital_expenditures: Optional[float] = None
    capital_expenditure_for_property_plant_equipment: Optional[float] = None
    proceeds_from_sale_of_property_plant_equipment: Optional[float] = None
    investment_purchase_and_sale: Optional[float] = None
    sale_purchase_of_investment: Optional[float] = None
    net_borrowings: Optional[float] = None
    other_financing_activities: Optional[float] = None
    cash_flow_from_financing: Optional[float] = None
    dividends_paid: Optional[float] = None
    free_cash_flow: Optional[float] = None
    raw_data: Optional[Dict[str, Any]] = None


class StockCashFlowResponse(StockCashFlowBase):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
