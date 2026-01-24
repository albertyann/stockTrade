from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..models.quant_strategy import (
    QuantStrategy,
    StrategyVersion,
    BacktestResult,
    StrategySignal,
    StrategyPerformance,
    StrategyPosition,
)
from ..schemas.quant_strategy import (
    QuantStrategyCreate,
    QuantStrategyUpdate,
    StrategyVersionCreate,
    BacktestResultCreate,
    StrategySignalCreate,
    StrategySignalUpdate,
    StrategyPerformanceCreate,
    StrategyPositionCreate,
    StrategyPositionUpdate,
)
from typing import Optional, List


# QuantStrategy CRUD
def get_strategy(db: Session, strategy_id: int) -> Optional[QuantStrategy]:
    return db.query(QuantStrategy).filter(QuantStrategy.id == strategy_id).first()


def get_strategy_by_code(db: Session, strategy_code: str) -> Optional[QuantStrategy]:
    return db.query(QuantStrategy).filter(QuantStrategy.strategy_code == strategy_code).first()


def get_strategies(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None,
                   status: Optional[str] = None, search: Optional[str] = None):
    query = db.query(QuantStrategy)

    if user_id:
        query = query.filter(QuantStrategy.user_id == user_id)

    if status:
        query = query.filter(QuantStrategy.status == status)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (QuantStrategy.strategy_code.ilike(search_pattern)) |
            (QuantStrategy.name.ilike(search_pattern)) |
            (QuantStrategy.description.ilike(search_pattern))
        )

    total = query.count()
    strategies = query.order_by(desc(QuantStrategy.created_at)).offset(skip).limit(limit).all()
    return {"data": strategies, "total": total}


def create_strategy(db: Session, strategy: QuantStrategyCreate, user_id: int) -> QuantStrategy:
    strategy_data = strategy.model_dump()
    db_strategy = QuantStrategy(**strategy_data, user_id=user_id)
    db.add(db_strategy)
    db.commit()
    db.refresh(db_strategy)
    return db_strategy


def update_strategy(db: Session, strategy_id: int, strategy: QuantStrategyUpdate) -> Optional[QuantStrategy]:
    db_strategy = get_strategy(db, strategy_id)
    if db_strategy:
        update_data = strategy.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_strategy, key, value)
        db.commit()
        db.refresh(db_strategy)
    return db_strategy


def delete_strategy(db: Session, strategy_id: int) -> bool:
    db_strategy = get_strategy(db, strategy_id)
    if db_strategy:
        db.delete(db_strategy)
        db.commit()
        return True
    return False


# StrategyVersion CRUD
def get_strategy_version(db: Session, version_id: int) -> Optional[StrategyVersion]:
    return db.query(StrategyVersion).filter(StrategyVersion.id == version_id).first()


def get_strategy_versions(db: Session, strategy_id: int, skip: int = 0, limit: int = 100):
    query = db.query(StrategyVersion).filter(StrategyVersion.strategy_id == strategy_id)
    total = query.count()
    versions = query.order_by(desc(StrategyVersion.created_at)).offset(skip).limit(limit).all()
    return {"data": versions, "total": total}


def create_strategy_version(db: Session, version: StrategyVersionCreate) -> StrategyVersion:
    version_data = version.model_dump()
    db_version = StrategyVersion(**version_data)
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


# BacktestResult CRUD
def get_backtest_result(db: Session, result_id: int) -> Optional[BacktestResult]:
    return db.query(BacktestResult).filter(BacktestResult.id == result_id).first()


def get_backtest_results(db: Session, strategy_id: int, skip: int = 0, limit: int = 100):
    query = db.query(BacktestResult).filter(BacktestResult.strategy_id == strategy_id)
    total = query.count()
    results = query.order_by(desc(BacktestResult.created_at)).offset(skip).limit(limit).all()
    return {"data": results, "total": total}


def create_backtest_result(db: Session, result: BacktestResultCreate) -> BacktestResult:
    result_data = result.model_dump()
    db_result = BacktestResult(**result_data)
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


def update_backtest_result(db: Session, result_id: int, result_data: dict) -> Optional[BacktestResult]:
    db_result = get_backtest_result(db, result_id)
    if db_result:
        for key, value in result_data.items():
            if value is not None:
                setattr(db_result, key, value)
        db.commit()
        db.refresh(db_result)
    return db_result


# StrategySignal CRUD
def get_strategy_signal(db: Session, signal_id: int) -> Optional[StrategySignal]:
    return db.query(StrategySignal).filter(StrategySignal.id == signal_id).first()


def get_strategy_signals(db: Session, strategy_id: int, skip: int = 0, limit: int = 100,
                         status: Optional[str] = None, signal_type: Optional[str] = None):
    query = db.query(StrategySignal).filter(StrategySignal.strategy_id == strategy_id)

    if status:
        query = query.filter(StrategySignal.status == status)

    if signal_type:
        query = query.filter(StrategySignal.signal_type == signal_type)

    total = query.count()
    signals = query.order_by(desc(StrategySignal.signal_time)).offset(skip).limit(limit).all()
    return {"data": signals, "total": total}


def create_strategy_signal(db: Session, signal: StrategySignalCreate) -> StrategySignal:
    signal_data = signal.model_dump()
    db_signal = StrategySignal(**signal_data)
    db.add(db_signal)
    db.commit()
    db.refresh(db_signal)
    return db_signal


def update_strategy_signal(db: Session, signal_id: int, signal: StrategySignalUpdate) -> Optional[StrategySignal]:
    db_signal = get_strategy_signal(db, signal_id)
    if db_signal:
        update_data = signal.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_signal, key, value)
        db.commit()
        db.refresh(db_signal)
    return db_signal


# StrategyPerformance CRUD
def get_strategy_performance(db: Session, performance_id: int) -> Optional[StrategyPerformance]:
    return db.query(StrategyPerformance).filter(StrategyPerformance.id == performance_id).first()


def get_strategy_performances(db: Session, strategy_id: int, start_date: Optional[str] = None,
                              end_date: Optional[str] = None, skip: int = 0, limit: int = 100):
    query = db.query(StrategyPerformance).filter(StrategyPerformance.strategy_id == strategy_id)

    if start_date:
        query = query.filter(StrategyPerformance.performance_date >= start_date)

    if end_date:
        query = query.filter(StrategyPerformance.performance_date <= end_date)

    total = query.count()
    performances = query.order_by(StrategyPerformance.performance_date).offset(skip).limit(limit).all()
    return {"data": performances, "total": total}


def create_strategy_performance(db: Session, performance: StrategyPerformanceCreate) -> StrategyPerformance:
    performance_data = performance.model_dump()
    db_performance = StrategyPerformance(**performance_data)
    db.add(db_performance)
    db.commit()
    db.refresh(db_performance)
    return db_performance


# StrategyPosition CRUD
def get_strategy_position(db: Session, position_id: int) -> Optional[StrategyPosition]:
    return db.query(StrategyPosition).filter(StrategyPosition.id == position_id).first()


def get_strategy_positions(db: Session, strategy_id: int, skip: int = 0, limit: int = 100,
                           status: Optional[str] = None, stock_id: Optional[int] = None):
    query = db.query(StrategyPosition).filter(StrategyPosition.strategy_id == strategy_id)

    if status:
        query = query.filter(StrategyPosition.status == status)

    if stock_id:
        query = query.filter(StrategyPosition.stock_id == stock_id)

    total = query.count()
    positions = query.order_by(desc(StrategyPosition.created_at)).offset(skip).limit(limit).all()
    return {"data": positions, "total": total}


def create_strategy_position(db: Session, position: StrategyPositionCreate) -> StrategyPosition:
    position_data = position.model_dump()
    db_position = StrategyPosition(**position_data)
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position


def update_strategy_position(db: Session, position_id: int, position: StrategyPositionUpdate) -> Optional[StrategyPosition]:
    db_position = get_strategy_position(db, position_id)
    if db_position:
        update_data = position.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_position, key, value)
        db.commit()
        db.refresh(db_position)
    return db_position
