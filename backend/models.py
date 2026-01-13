from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user_stocks = relationship("UserStock", back_populates="user")
    investment_notes = relationship("InvestmentNote", back_populates="user")
    uploaded_files = relationship("UploadedFile", back_populates="user")
    analysis_rules = relationship("AnalysisRule", back_populates="user")


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
    
    user_stocks = relationship("UserStock", back_populates="stock")
    investment_notes = relationship("InvestmentNote", back_populates="stock")
    uploaded_files = relationship("UploadedFile", back_populates="stock")


class UserStock(Base):
    __tablename__ = "user_stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="user_stocks")
    stock = relationship("Stock", back_populates="user_stocks")


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
    
    user = relationship("User", back_populates="investment_notes")
    stock = relationship("Stock", back_populates="investment_notes")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    file_name = Column(String(200), nullable=False)
    file_type = Column(String(50))
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    tags = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="uploaded_files")
    stock = relationship("Stock", back_populates="uploaded_files")


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
    
    user = relationship("User", back_populates="analysis_rules")
    analysis_results = relationship("AnalysisResult", back_populates="rule")


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
    
    rule = relationship("AnalysisRule", back_populates="analysis_results")
    stock = relationship("Stock")
