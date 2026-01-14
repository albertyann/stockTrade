from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, Boolean, String, Text
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


class AnalysisTask(Base):
    __tablename__ = "analysis_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_name = Column(String(200), nullable=False)
    ai_provider = Column(String(50), nullable=False)
    ai_generated_script = Column(Text)
    ai_reasoning = Column(Text)
    execution_log = Column(JSON)
    matched_stock_ids = Column(JSON)
    status = Column(String(20), nullable=False, default='pending')
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
