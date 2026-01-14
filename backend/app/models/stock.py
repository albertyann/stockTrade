from sqlalchemy import Column, Integer, String, DateTime, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Stock(Base):
    __tablename__ = "stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    ts_code = Column(String(20), unique=True, index=True)
    symbol = Column(String(20), index=True)
    name = Column(String(100), nullable=False)
    area = Column(String(50))
    industry = Column(String(100))
    fullname = Column(String(200))
    enname = Column(String(200))
    cnspell = Column(String(50))
    market = Column(String(20))
    exchange = Column(String(10))
    curr_type = Column(String(10))
    list_status = Column(String(5))
    list_date = Column(Date)
    delist_date = Column(Date)
    is_hs = Column(String(5))
    act_name = Column(String(200))
    act_ent_type = Column(String(100))
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
