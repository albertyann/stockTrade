from sqlalchemy import Column, String, Float, Integer, DateTime, Date, JSON
from sqlalchemy.sql import func
from ..database import Base


class StockCashFlow(Base):
    __tablename__ = "stock_cash_flow"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, index=True)
    ts_code = Column(String(20), index=True)
    fiscal_date_ending = Column(Date, index=True)
    reported_currency = Column(String(10))
    operating_cashflow = Column(Float)
    payments_for_operating_activities = Column(Float)
    proceeds_from_operating_activities = Column(Float)
    depreciation_amortization = Column(Float)
    stock_based_compensation = Column(Float)
    operating_cashflow_continuing = Column(Float)
    capital_expenditures = Column(Float)
    capital_expenditure_for_property_plant_equipment = Column(Float)
    proceeds_from_sale_of_property_plant_equipment = Column(Float)
    investment_purchase_and_sale = Column(Float)
    sale_purchase_of_investment = Column(Float)
    net_borrowings = Column(Float)
    other_financing_activities = Column(Float)
    cash_flow_from_financing = Column(Float)
    dividends_paid = Column(Float)
    free_cash_flow = Column(Float)
    raw_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
