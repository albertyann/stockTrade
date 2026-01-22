from sqlalchemy import Column, String, Float, Integer, DateTime, Date, JSON
from sqlalchemy.sql import func
from ..database import Base


class StockIncomeStatement(Base):
    __tablename__ = "stock_income_statement"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, index=True)
    ts_code = Column(String(20), index=True)
    fiscal_date_ending = Column(Date, index=True)
    reported_currency = Column(String(10))
    total_revenue = Column(Float)
    cost_of_revenue = Column(Float)
    gross_profit = Column(Float)
    total_operating_expenses = Column(Float)
    operating_income = Column(Float)
    interest_expense = Column(Float)
    income_before_tax = Column(Float)
    income_tax_expense = Column(Float)
    net_income = Column(Float)
    ebit = Column(Float)
    ebitda = Column(Float)
    net_income_from_continuing_operations = Column(Float)
    comprehensive_income_net_of_tax = Column(Float)
    # 存储完整的 JSON 数据，便于前端展示
    raw_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
