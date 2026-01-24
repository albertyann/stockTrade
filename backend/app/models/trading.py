from sqlalchemy import Column, Integer, String, DateTime, Date, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class OrderType(str, enum.Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"
    STOP_LIMIT = "STOP_LIMIT"


class OrderSide(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    PARTIAL_FILLED = "PARTIAL_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    ts_code = Column(String(20), index=True)

    order_type = Column(SQLEnum(OrderType), nullable=False)
    side = Column(SQLEnum(OrderSide), nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)

    quantity = Column(Integer, nullable=False)
    filled_quantity = Column(Integer, default=0)
    price = Column(Float)
    stop_price = Column(Float)

    order_value = Column(Float)
    commission = Column(Float)
    slippage = Column(Float)

    message = Column(String(255))

    submitted_at = Column(DateTime(timezone=True))
    filled_at = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="orders")
    strategy = relationship("QuantStrategy")
    stock = relationship("Stock")
    transactions = relationship("Transaction", back_populates="order")


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    ts_code = Column(String(20), index=True)

    quantity = Column(Integer, nullable=False)
    avg_cost = Column(Float)
    total_cost = Column(Float)

    current_price = Column(Float)
    current_value = Column(Float)
    market_value = Column(Float)

    realized_pnl = Column(Float, default=0)
    unrealized_pnl = Column(Float, default=0)
    unrealized_pnl_ratio = Column(Float, default=0)

    open_quantity = Column(Integer)
    closed_quantity = Column(Integer, default=0)

    last_trade_date = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="positions")
    strategy = relationship("QuantStrategy")
    stock = relationship("Stock")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"))

    initial_capital = Column(Float, nullable=False)
    current_capital = Column(Float)
    total_value = Column(Float)
    cash_balance = Column(Float)
    position_value = Column(Float)

    total_pnl = Column(Float, default=0)
    total_pnl_ratio = Column(Float, default=0)

    daily_return = Column(Float)
    daily_pnl = Column(Float)

    risk_exposure = Column(Float)
    leverage = Column(Float, default=1.0)

    as_of_date = Column(Date, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    strategy = relationship("QuantStrategy")


class TransactionType(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"
    DEPOSIT = "DEPOSIT"
    WITHDRAW = "WITHDRAW"
    DIVIDEND = "DIVIDEND"
    COMMISSION = "COMMISSION"
    FEE = "FEE"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_code = Column(String(50), unique=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"))
    order_id = Column(Integer, ForeignKey("orders.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    ts_code = Column(String(20), index=True)

    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    side = Column(String(10))

    quantity = Column(Integer)
    price = Column(Float)
    amount = Column(Float)

    commission = Column(Float, default=0)
    tax = Column(Float, default=0)
    slippage = Column(Float, default=0)

    before_balance = Column(Float)
    after_balance = Column(Float)

    transaction_date = Column(DateTime(timezone=True), nullable=False)
    settlement_date = Column(DateTime(timezone=True))

    notes = Column(String(500))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    strategy = relationship("QuantStrategy")
    order = relationship("Order", back_populates="transactions")
    stock = relationship("Stock")
