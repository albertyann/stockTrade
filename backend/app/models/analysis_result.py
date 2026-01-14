from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("analysis_rules.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    data = Column(JSON)
    matched = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
