from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Text, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class StrategyType(str, enum.Enum):
    MA_CROSS = "MA_CROSS"
    RSI_OVERSOLD = "RSI_OVERSOLD"
    BOLLINGER_BAND = "BOLLINGER_BAND"
    MACD = "MACD"
    MOMENTUM = "MOMENTUM"
    MEAN_REVERSION = "MEAN_REVERSION"
    PAIR_TRADING = "PAIR_TRADING"
    CUSTOM = "CUSTOM"


class StrategyFrequency(str, enum.Enum):
    TICK = "TICK"
    MIN_1 = "1min"
    MIN_5 = "5min"
    MIN_15 = "15min"
    MIN_30 = "30min"
    HOUR_1 = "1hour"
    DAY_1 = "1day"
    WEEK_1 = "1week"
    MONTH_1 = "1month"


class StrategyStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    TESTING = "TESTING"
    BACKTESTING = "BACKTESTING"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"
    ARCHIVED = "ARCHIVED"


class QuantStrategy(Base):
    __tablename__ = "quant_strategies"

    id = Column(Integer, primary_key=True, index=True)
    strategy_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    strategy_type = Column(SQLEnum(StrategyType), nullable=False)
    frequency = Column(SQLEnum(StrategyFrequency), default=StrategyFrequency.DAY_1)
    parameters = Column(JSON)
    status = Column(SQLEnum(StrategyStatus), default=StrategyStatus.DRAFT)
    is_active = Column(Integer, default=0)
    max_position_value = Column(Float)
    max_single_stock_ratio = Column(Float)
    stop_loss_ratio = Column(Float)
    take_profit_ratio = Column(Float)
    total_return = Column(Float)
    annual_return = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    win_rate = Column(Float)
    strategy_script = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="strategies")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    versions = relationship("StrategyVersion", back_populates="strategy", cascade="all, delete-orphan")
    backtest_results = relationship("BacktestResult", back_populates="strategy", cascade="all, delete-orphan")
    signals = relationship("StrategySignal", back_populates="strategy", cascade="all, delete-orphan")
    positions = relationship("StrategyPosition", back_populates="strategy", cascade="all, delete-orphan")
    performance = relationship("StrategyPerformance", back_populates="strategy", cascade="all, delete-orphan")


class StrategyVersion(Base):
    __tablename__ = "strategy_versions"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"), nullable=False)
    version = Column(String(20), nullable=False)
    change_description = Column(Text)
    change_log = Column(JSON)
    parameters_snapshot = Column(JSON)
    script_snapshot = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    strategy = relationship("QuantStrategy", back_populates="versions")


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"), nullable=False)
    version_id = Column(Integer, ForeignKey("strategy_versions.id"))
    start_date = Column(Date)
    end_date = Column(Date)
    initial_capital = Column(Float)
    commission_rate = Column(Float)
    final_capital = Column(Float)
    total_return = Column(Float)
    annual_return = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    max_drawdown_duration = Column(Integer)
    volatility = Column(Float)
    win_rate = Column(Float)
    profit_factor = Column(Float)
    total_trades = Column(Integer)
    winning_trades = Column(Integer)
    losing_trades = Column(Integer)
    avg_win = Column(Float)
    avg_loss = Column(Float)
    largest_win = Column(Float)
    largest_loss = Column(Float)
    equity_curve = Column(JSON)
    status = Column(String(20), default="PENDING")
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    strategy = relationship("QuantStrategy", back_populates="backtest_results")
    version = relationship("StrategyVersion")


class StrategySignal(Base):
    __tablename__ = "strategy_signals"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    ts_code = Column(String(20), index=True)
    signal_type = Column(String(10), nullable=False)
    direction = Column(String(10))
    strength = Column(Float)
    confidence = Column(Float)
    price = Column(Float)
    target_price = Column(Float)
    stop_loss_price = Column(Float)
    suggested_quantity = Column(Integer)
    status = Column(String(20), default="PENDING")
    order_id = Column(Integer)
    signal_time = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    strategy = relationship("QuantStrategy", back_populates="signals")
    stock = relationship("Stock")


class StrategyPerformance(Base):
    __tablename__ = "strategy_performance"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"), nullable=False)
    performance_date = Column(Date, nullable=False, index=True)
    initial_value = Column(Float)
    final_value = Column(Float)
    daily_return = Column(Float)
    cumulative_return = Column(Float)
    cumulative_pnl = Column(Float)
    volatility = Column(Float)
    max_drawdown = Column(Float)
    total_position = Column(Float)
    cash_balance = Column(Float)
    daily_trades = Column(Integer)
    total_trades = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    strategy = relationship("QuantStrategy", back_populates="performance")

    __table_args__ = (
        {'comment': '策略绩效表'},
    )


class StrategyPosition(Base):
    __tablename__ = "strategy_positions"

    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("quant_strategies.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    ts_code = Column(String(20), index=True)
    quantity = Column(Integer, nullable=False)
    avg_cost = Column(Float)
    total_cost = Column(Float)
    current_price = Column(Float)
    current_value = Column(Float)
    unrealized_pnl = Column(Float)
    unrealized_pnl_ratio = Column(Float)
    status = Column(String(20), default="OPEN")
    open_time = Column(DateTime(timezone=True))
    close_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    strategy = relationship("QuantStrategy", back_populates="positions")
    stock = relationship("Stock")

    __table_args__ = (
        {'comment': '策略持仓表'},
    )
