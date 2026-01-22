from sqlalchemy import Column, String, Float, Integer, DateTime, Date, JSON
from sqlalchemy.sql import func
from ..database import Base


class StockBalanceSheet(Base):
    __tablename__ = "stock_balance_sheet"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, index=True)
    ts_code = Column(String(20), index=True)
    fiscal_date_ending = Column(Date, index=True)
    reported_currency = Column(String(10))
    total_assets = Column(Float)
    total_current_assets = Column(Float)
    cash_and_cash_equivalents_at_carrying_value = Column(Float)
    cash_and_short_term_investments = Column(Float)
    total_non_current_assets = Column(Float)
    property_plant_equipment = Column(Float)
    total_liabilities = Column(Float)
    total_current_liabilities = Column(Float)
    current_long_term_debt = Column(Float)
    long_term_debt = Column(Float)
    total_non_current_liabilities = Column(Float)
    total_shareholder_equity = Column(Float)
    treasury_stock = Column(Float)
    retained_earnings = Column(Float)
    common_shares_outstanding = Column(Float)
    raw_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
