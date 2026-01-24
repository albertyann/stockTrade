from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user_stocks = relationship("UserStock", back_populates="user")
    strategies = relationship("QuantStrategy", back_populates="user")
    orders = relationship("Order", back_populates="user")
    positions = relationship("Position", back_populates="user")
    portfolios = relationship("Portfolio", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
