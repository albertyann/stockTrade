from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from ..models.trading import OrderType, OrderSide, OrderStatus, TransactionType


class OrderBase(BaseModel):
    order_code: str = Field(..., max_length=50)
    stock_id: int
    ts_code: Optional[str] = None
    order_type: OrderType
    side: OrderSide
    quantity: int = Field(..., gt=0)
    price: Optional[float] = None
    stop_price: Optional[float] = None


class OrderCreate(OrderBase):
    strategy_id: Optional[int] = None


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    filled_quantity: Optional[int] = None
    price: Optional[float] = None
    stop_price: Optional[float] = None
    message: Optional[str] = Field(None, max_length=255)


class OrderResponse(OrderBase):
    id: int
    user_id: int
    strategy_id: Optional[int] = None
    status: OrderStatus
    filled_quantity: int = 0
    order_value: Optional[float] = None
    commission: Optional[float] = None
    slippage: Optional[float] = None
    message: Optional[str] = None
    submitted_at: Optional[datetime] = None
    filled_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PositionBase(BaseModel):
    stock_id: int
    ts_code: Optional[str] = None
    quantity: int = Field(..., gt=0)


class PositionCreate(PositionBase):
    strategy_id: Optional[int] = None


class PositionUpdate(BaseModel):
    quantity: Optional[int] = None
    avg_cost: Optional[float] = None
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    market_value: Optional[float] = None
    realized_pnl: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    unrealized_pnl_ratio: Optional[float] = None
    open_quantity: Optional[int] = None
    closed_quantity: Optional[int] = None
    last_trade_date: Optional[datetime] = None


class PositionResponse(PositionBase):
    id: int
    user_id: int
    strategy_id: Optional[int] = None
    avg_cost: Optional[float] = None
    total_cost: Optional[float] = None
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    market_value: Optional[float] = None
    realized_pnl: float = 0
    unrealized_pnl: float = 0
    unrealized_pnl_ratio: float = 0
    open_quantity: Optional[int] = None
    closed_quantity: int = 0
    last_trade_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PortfolioBase(BaseModel):
    initial_capital: float = Field(..., gt=0)
    as_of_date: date


class PortfolioCreate(PortfolioBase):
    strategy_id: Optional[int] = None


class PortfolioUpdate(BaseModel):
    current_capital: Optional[float] = None
    total_value: Optional[float] = None
    cash_balance: Optional[float] = None
    position_value: Optional[float] = None
    total_pnl: Optional[float] = None
    total_pnl_ratio: Optional[float] = None
    daily_return: Optional[float] = None
    daily_pnl: Optional[float] = None
    risk_exposure: Optional[float] = None
    leverage: Optional[float] = None


class PortfolioResponse(PortfolioBase):
    id: int
    user_id: int
    strategy_id: Optional[int] = None
    current_capital: Optional[float] = None
    total_value: Optional[float] = None
    cash_balance: Optional[float] = None
    position_value: Optional[float] = None
    total_pnl: float = 0
    total_pnl_ratio: float = 0
    daily_return: Optional[float] = None
    daily_pnl: Optional[float] = None
    risk_exposure: Optional[float] = None
    leverage: float = 1.0
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    transaction_code: str = Field(..., max_length=50)
    transaction_type: TransactionType
    side: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None
    amount: Optional[float] = None


class TransactionCreate(TransactionBase):
    stock_id: Optional[int] = None
    ts_code: Optional[str] = None
    order_id: Optional[int] = None
    strategy_id: Optional[int] = None
    transaction_date: datetime


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    strategy_id: Optional[int] = None
    order_id: Optional[int] = None
    stock_id: Optional[int] = None
    ts_code: Optional[str] = None
    commission: float = 0
    tax: float = 0
    slippage: float = 0
    before_balance: Optional[float] = None
    after_balance: Optional[float] = None
    transaction_date: datetime
    settlement_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PlaceOrderRequest(BaseModel):
    stock_id: int
    order_type: OrderType
    side: OrderSide
    quantity: int = Field(..., gt=0)
    price: Optional[float] = None
    stop_price: Optional[float] = None
    strategy_id: Optional[int] = None


class CancelOrderRequest(BaseModel):
    reason: Optional[str] = None


class PortfolioSummary(BaseModel):
    total_value: float
    cash_balance: float
    position_value: float
    total_pnl: float
    total_pnl_ratio: float
    daily_return: Optional[float] = None
    risk_exposure: float
    leverage: float
    as_of_date: date


class PaginatedOrderResponse(BaseModel):
    data: list[OrderResponse]
    total: int


class PaginatedPositionResponse(BaseModel):
    data: list[PositionResponse]
    total: int
