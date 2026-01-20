from sqlalchemy import Column, String, Float, Integer, DateTime, Date
from sqlalchemy.sql import func
from ..database import Base


class StockMoneyflow(Base):
    __tablename__ = "stock_moneyflow"

    id = Column(Integer, primary_key=True, index=True)
    ts_code = Column(String(20), index=True)
    trade_date = Column(Date, index=True)
    buy_elg_vol = Column(Float)
    buy_elg_amt = Column(Float)
    sell_elg_vol = Column(Float)
    sell_elg_amt = Column(Float)
    buy_lg_vol = Column(Float)
    buy_lg_amt = Column(Float)
    sell_lg_vol = Column(Float)
    sell_lg_amt = Column(Float)
    buy_md_vol = Column(Float)
    buy_md_amt = Column(Float)
    sell_md_vol = Column(Float)
    sell_md_amt = Column(Float)
    buy_sm_vol = Column(Float)
    buy_sm_amt = Column(Float)
    sell_sm_vol = Column(Float)
    sell_sm_amt = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
