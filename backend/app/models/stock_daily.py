from sqlalchemy import Column, String, Float, Integer, DateTime, Date
from sqlalchemy.sql import func
from ..database import Base


class StockDaily(Base):
    __tablename__ = "stock_daily"

    ts_code = Column(String(20), primary_key=True)
    trade_date = Column(Date, primary_key=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    pre_close = Column(Float)
    change = Column(Float)
    pct_chg = Column(Float)
    vol = Column(Float)
    amount = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
