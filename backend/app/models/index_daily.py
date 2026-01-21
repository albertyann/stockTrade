from sqlalchemy import Column, String, Float, Integer, DateTime, Date
from sqlalchemy.sql import func
from ..database import Base


class IndexDaily(Base):
    """指数日线行情表"""
    __tablename__ = "index_daily"

    ts_code = Column(String(20), primary_key=True, comment="TS代码")
    trade_date = Column(Date, primary_key=True, comment="交易日期")
    open = Column(Float, comment="开盘点")
    high = Column(Float, comment="最高点")
    low = Column(Float, comment="最低点")
    close = Column(Float, comment="收盘点")
    pre_close = Column(Float, comment="昨收点")
    change = Column(Float, comment="涨跌点")
    pct_chg = Column(Float, comment="涨跌幅(%)")
    vol = Column(Float, comment="成交量(手)")
    amount = Column(Float, comment="成交额(千元)")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
