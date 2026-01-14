from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class InvestmentNote(Base):
    __tablename__ = "investment_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(String)
    tags = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
