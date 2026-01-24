from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, Any
from ..models.quant_strategy import StrategyType, StrategyFrequency, StrategyStatus


class QuantStrategyBase(BaseModel):
    strategy_code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    strategy_type: StrategyType
    frequency: StrategyFrequency = StrategyFrequency.DAY_1
    parameters: Optional[dict] = None
    status: StrategyStatus = StrategyStatus.DRAFT
    is_active: int = 0
    max_position_value: Optional[float] = None
    max_single_stock_ratio: Optional[float] = None
    stop_loss_ratio: Optional[float] = None
    take_profit_ratio: Optional[float] = None
    strategy_script: Optional[str] = None


class QuantStrategyCreate(QuantStrategyBase):
    pass


class QuantStrategyUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    strategy_type: Optional[StrategyType] = None
    frequency: Optional[StrategyFrequency] = None
    parameters: Optional[dict] = None
    status: Optional[StrategyStatus] = None
    is_active: Optional[int] = None
    max_position_value: Optional[float] = None
    max_single_stock_ratio: Optional[float] = None
    stop_loss_ratio: Optional[float] = None
    take_profit_ratio: Optional[float] = None
    strategy_script: Optional[str] = None


class QuantStrategyResponse(QuantStrategyBase):
    id: int
    user_id: Optional[int] = None
    total_return: Optional[float] = None
    annual_return: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    win_rate: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class StrategyVersionBase(BaseModel):
    version: str = Field(..., max_length=20)
    change_description: Optional[str] = None
    change_log: Optional[dict] = None
    parameters_snapshot: Optional[dict] = None
    script_snapshot: Optional[str] = None


class StrategyVersionCreate(StrategyVersionBase):
    strategy_id: int


class StrategyVersionResponse(StrategyVersionBase):
    id: int
    strategy_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BacktestResultBase(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    initial_capital: Optional[float] = None
    commission_rate: Optional[float] = None


class BacktestResultCreate(BacktestResultBase):
    strategy_id: int
    version_id: Optional[int] = None


class BacktestResultResponse(BacktestResultBase):
    id: int
    strategy_id: int
    version_id: Optional[int] = None
    final_capital: Optional[float] = None
    total_return: Optional[float] = None
    annual_return: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    max_drawdown_duration: Optional[int] = None
    volatility: Optional[float] = None
    win_rate: Optional[float] = None
    profit_factor: Optional[float] = None
    total_trades: Optional[int] = None
    winning_trades: Optional[int] = None
    losing_trades: Optional[int] = None
    avg_win: Optional[float] = None
    avg_loss: Optional[float] = None
    largest_win: Optional[float] = None
    largest_loss: Optional[float] = None
    equity_curve: Optional[dict] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class StrategySignalBase(BaseModel):
    stock_id: Optional[int] = None
    ts_code: Optional[str] = None
    signal_type: str
    direction: Optional[str] = None
    strength: Optional[float] = None
    confidence: Optional[float] = None
    price: Optional[float] = None
    target_price: Optional[float] = None
    stop_loss_price: Optional[float] = None
    suggested_quantity: Optional[int] = None


class StrategySignalCreate(StrategySignalBase):
    strategy_id: int
    signal_time: datetime


class StrategySignalUpdate(BaseModel):
    status: Optional[str] = None
    order_id: Optional[int] = None


class StrategySignalResponse(StrategySignalBase):
    id: int
    strategy_id: int
    status: str
    order_id: Optional[int] = None
    signal_time: datetime
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class StrategyPerformanceBase(BaseModel):
    performance_date: date
    initial_value: Optional[float] = None
    final_value: Optional[float] = None
    daily_return: Optional[float] = None
    cumulative_return: Optional[float] = None
    cumulative_pnl: Optional[float] = None
    volatility: Optional[float] = None
    max_drawdown: Optional[float] = None
    total_position: Optional[float] = None
    cash_balance: Optional[float] = None
    daily_trades: Optional[int] = None
    total_trades: Optional[int] = None


class StrategyPerformanceCreate(StrategyPerformanceBase):
    strategy_id: int


class StrategyPerformanceResponse(StrategyPerformanceBase):
    id: int
    strategy_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StrategyPositionBase(BaseModel):
    stock_id: int
    ts_code: Optional[str] = None
    quantity: int
    avg_cost: Optional[float] = None
    total_cost: Optional[float] = None
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    unrealized_pnl_ratio: Optional[float] = None
    status: str = "OPEN"


class StrategyPositionCreate(StrategyPositionBase):
    strategy_id: int


class StrategyPositionUpdate(BaseModel):
    quantity: Optional[int] = None
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    unrealized_pnl_ratio: Optional[float] = None
    status: Optional[str] = None
    close_time: Optional[datetime] = None


class StrategyPositionResponse(StrategyPositionBase):
    id: int
    strategy_id: int
    open_time: Optional[datetime] = None
    close_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class BacktestRequest(BaseModel):
    start_date: date
    end_date: date
    initial_capital: float = Field(..., gt=0)
    commission_rate: float = Field(0.0003, ge=0)


class ExecuteStrategyRequest(BaseModel):
    dry_run: bool = True


class PaginatedResponse(BaseModel):
    data: list[QuantStrategyResponse]
    total: int
