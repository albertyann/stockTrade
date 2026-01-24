from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ...database import get_db
from ...schemas.quant_strategy import (
    QuantStrategyResponse,
    QuantStrategyCreate,
    QuantStrategyUpdate,
    StrategyVersionResponse,
    BacktestResultResponse,
    StrategySignalResponse,
    StrategyPerformanceResponse,
    StrategyPositionResponse,
    BacktestRequest,
    ExecuteStrategyRequest,
    PaginatedResponse,
)
from ...schemas.user import UserResponse
from ...core.security import get_current_active_user
from ...crud import quant_strategy as strategy_crud
from ...services.strategy_service import StrategyService

router = APIRouter()


@router.post("/", response_model=QuantStrategyResponse)
async def create_strategy(
    strategy: QuantStrategyCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    existing = strategy_crud.get_strategy_by_code(db, strategy_code=strategy.strategy_code)
    if existing:
        raise HTTPException(status_code=400, detail="Strategy code already exists")
    
    return strategy_crud.create_strategy(db, strategy=strategy, user_id=current_user.id)


@router.get("/", response_model=PaginatedResponse)
async def read_strategies(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = strategy_crud.get_strategies(
        db, skip=skip, limit=limit,
        user_id=current_user.id, status=status, search=search
    )
    return result


@router.get("/{strategy_id}", response_model=QuantStrategyResponse)
async def read_strategy(
    strategy_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this strategy")
    
    return db_strategy


@router.put("/{strategy_id}", response_model=QuantStrategyResponse)
async def update_strategy(
    strategy_id: int,
    strategy: QuantStrategyUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this strategy")
    
    updated = strategy_crud.update_strategy(db, strategy_id=strategy_id, strategy=strategy)
    if updated is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return updated


@router.delete("/{strategy_id}")
async def delete_strategy(
    strategy_id: int,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this strategy")
    
    success = strategy_crud.delete_strategy(db, strategy_id=strategy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return {"message": "Strategy deleted successfully"}


@router.post("/{strategy_id}/backtest", response_model=dict)
async def run_backtest(
    strategy_id: int,
    request: BacktestRequest,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to backtest this strategy")
    
    service = StrategyService(db)
    
    def run_background_backtest():
        try:
            service.run_backtest(request)
        except Exception as e:
            print(f"Background backtest failed: {str(e)}")
    
    background_tasks.add_task(run_background_backtest)
    
    return {
        "message": "Backtest started in background",
        "strategy_id": strategy_id,
        "start_date": request.start_date,
        "end_date": request.end_date,
    }


@router.get("/{strategy_id}/backtest-results", response_model=dict)
async def get_backtest_results(
    strategy_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this strategy")
    
    result = strategy_crud.get_backtest_results(db, strategy_id=strategy_id, skip=skip, limit=limit)
    return result


@router.post("/{strategy_id}/execute", response_model=dict)
async def execute_strategy(
    strategy_id: int,
    request: ExecuteStrategyRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to execute this strategy")
    
    service = StrategyService(db)
    result = service.execute_strategy(strategy_id, dry_run=request.dry_run)
    
    return result


@router.get("/{strategy_id}/signals", response_model=dict)
async def get_strategy_signals(
    strategy_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    signal_type: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this strategy")
    
    result = strategy_crud.get_strategy_signals(
        db, strategy_id=strategy_id, skip=skip, limit=limit,
        status=status, signal_type=signal_type
    )
    return result


@router.get("/{strategy_id}/positions", response_model=dict)
async def get_strategy_positions(
    strategy_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    stock_id: Optional[int] = None,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this strategy")
    
    result = strategy_crud.get_strategy_positions(
        db, strategy_id=strategy_id, skip=skip, limit=limit,
        status=status, stock_id=stock_id
    )
    return result


@router.get("/{strategy_id}/performance", response_model=dict)
async def get_strategy_performance(
    strategy_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this strategy")
    
    result = strategy_crud.get_strategy_performances(
        db, strategy_id=strategy_id, start_date=start_date,
        end_date=end_date, skip=skip, limit=limit
    )
    return result


@router.get("/{strategy_id}/versions", response_model=dict)
async def get_strategy_versions(
    strategy_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this strategy")
    
    result = strategy_crud.get_strategy_versions(db, strategy_id=strategy_id, skip=skip, limit=limit)
    return result


@router.post("/{strategy_id}/versions", response_model=StrategyVersionResponse)
async def create_strategy_version(
    strategy_id: int,
    version_data: dict,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_strategy = strategy_crud.get_strategy(db, strategy_id=strategy_id)
    if db_strategy is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if db_strategy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create version for this strategy")
    
    from ...schemas.quant_strategy import StrategyVersionCreate
    version_create = StrategyVersionCreate(
        strategy_id=strategy_id,
        version=version_data.get("version", "1.0.0"),
        change_description=version_data.get("change_description"),
        change_log=version_data.get("change_log"),
        parameters_snapshot=db_strategy.parameters,
        script_snapshot=db_strategy.strategy_script,
    )
    
    return strategy_crud.create_strategy_version(db, version=version_create)
