from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Stock(Base):
    __tablename__ = "stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    market = Column(String(20))
    industry = Column(String(100))
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
