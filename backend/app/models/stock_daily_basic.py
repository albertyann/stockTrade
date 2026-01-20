from sqlalchemy import Column, String, Float, Integer, DateTime, Date
from sqlalchemy.sql import func
from ..database import Base


class StockDailyBasic(Base):
    __tablename__ = "stock_daily_basic"

    ts_code = Column(String(20), primary_key=True)
    trade_date = Column(Date, primary_key=True)
    close = Column(Float)
    turnover_rate = Column(Float)
    turnover_rate_f = Column(Float)
    volume_ratio = Column(Float)
    pe = Column(Float)
    pe_ttm = Column(Float)
    pb = Column(Float)
    ps = Column(Float)
    ps_ttm = Column(Float)
    dv_ratio = Column(Float)
    dv_ttm = Column(Float)
    total_share = Column(Float)
    float_share = Column(Float)
    free_share = Column(Float)
    total_mv = Column(Float)
    circ_mv = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
