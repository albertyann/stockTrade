from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class AnalysisRule(Base):
    __tablename__ = "analysis_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String)
    conditions = Column(JSON, nullable=False)
    priority = Column(Integer, default=1)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
